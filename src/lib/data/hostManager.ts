import { ref, computed } from 'vue';
import { saveData, getData, hasOwn } from '../utils';
import message from '../message';
import TokenRequest, { SwitchHostEvent } from '../token';

interface HostData {
    token: string,
    user: string,
    forum?: string,
    system_access: boolean
}

const historyHosts = ref<{
    [host: string]: HostData
}>(getData('historyHost') || {})

const sequenceHistoryHosts = computed(() => {
    return Object.keys(historyHosts.value).map(host => {
        return {
            host,
            token: historyHosts.value[host].token,
            forum: historyHosts.value[host].forum,
            user: historyHosts.value[host].user,
            system_access: historyHosts.value[host].system_access
        }
    })
});

export const currHost = ref(TokenRequest.host)
export const currHostData = computed(() => {
    return historyHosts.value[currHost.value] || null
})

function saveHistoryHosts() {
    saveData('historyHost', historyHosts.value);
}

function setToken(option: {
    host: string,
    forum?: string
    user: string,
    token: string,
    system_access: boolean
}) {
    historyHosts.value[option.host] = {
        token: option.token,
        forum: option.forum || historyHosts.value[option.host]?.forum,
        user: option.user,
        system_access: option.system_access
    }
    saveHistoryHosts();
}

function deleteHost(host: string) {
    delete historyHosts.value[host];
    saveHistoryHosts();
}

function setForum(host: string, forum: string) {
    if (hasOwn(historyHosts.value, host)) {
        historyHosts.value[host].forum = forum
        saveHistoryHosts();
    }
}

function switchHostByHistory(host: string) {
    if (historyHosts.value[host]) {
        TokenRequest.switchHost(host, historyHosts.value[host].token)
        message.notify('切换成功', message.success)
        SwitchHostEvent.call(host)
        return true
    } else {
        message.notify('该地址不存在', message.error)
        return false
    }
}



export {
    historyHosts,
    sequenceHistoryHosts,
    setToken,
    deleteHost,
    setForum,
    switchHostByHistory
}
