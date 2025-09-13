import { ref, computed } from 'vue';
import { saveData, getData, hasOwn, iterateObject } from '../utils';
import TokenRequest from '../token';
import Hook from '../hook';


export const SwitchTokenEvent = new Hook<string | undefined>()

export interface UserPermission {
    can_edit_forum: boolean,
    can_edit_rule_set: boolean
}
interface TokenData {
    host: string,
    user: string,
    forum?: string,
    system_access: boolean
    permission?: UserPermission
}


const historyTokens = ref<{
    [token: string]: TokenData
}>(getData('historyTokens') || {})

const sequenceHistoryTokens = computed(() => {
    return Object.keys(historyTokens.value).map(token => {
        return {
            token,
            host: historyTokens.value[token].host,
            forum: historyTokens.value[token].forum,
            user: historyTokens.value[token].user,
            system_access: historyTokens.value[token].system_access
        }
    })
});

export const currToken = ref(getData<string>('access_token') || '');
export const currTokenData = computed(() => {
    return historyTokens.value[currToken.value] || null
})

function saveHistoryTokens() {
    saveData('historyTokens', historyTokens.value);
}

function setToken(option: {
    host: string,
    forum?: string
    user: string,
    token: string,
    system_access: boolean
}) {
    iterateObject(historyTokens.value, (key, value) => {
        if (value.host === option.host && value.user === option.user && key !== option.token) {
            delete historyTokens.value[key];
        }
    })

    historyTokens.value[option.token] = {
        host: option.host,
        forum: option.forum || historyTokens.value[option.token]?.forum,
        user: option.user,
        system_access: option.system_access
    }
    saveHistoryTokens();
}

function deleteToken(token: string) {
    delete historyTokens.value[token];
    saveHistoryTokens();
}

function setTokenInfo(token: string, forum: string, permission: UserPermission) {
    if (hasOwn(historyTokens.value, token)) {
        historyTokens.value[token].forum = forum
        historyTokens.value[token].permission = permission
        saveHistoryTokens();
    }
}

function switchTokenByHistory(token: string) {
    if (historyTokens.value[token]) {
        TokenRequest.switchHost(historyTokens.value[token].host, token)
    }
    SwitchTokenEvent.call(token || undefined) // 显示过滤 空字符串 ''

    return hasOwn(historyTokens.value, token)
}



export {
    historyTokens,
    sequenceHistoryTokens,
    setToken,
    deleteToken,
    setTokenInfo,
    switchTokenByHistory
}
