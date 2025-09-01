import { ref, computed } from 'vue';
import { saveData, getData, hasOwn } from '../utils';
import message from '../message';
import TokenRequest, { SwitchHostEvent } from '../token';

const historyHosts = ref<{
    [host: string]: {
        token: string,
        user: string,
        forum?: string
    }
}>(getData('historyHost') || {})

const sequenceHistoryHosts = computed(() => {
    return Object.keys(historyHosts.value).map(host => {
        return {
            host,
            token: historyHosts.value[host].token,
            forum: historyHosts.value[host].forum,
            user: historyHosts.value[host].user
        }
    })
});

function saveHistoryHosts() {
    saveData('historyHost', historyHosts.value);
}

function setToken(option: {
    host: string,
    forum?: string
    user: string,
    token: string
}) {
    historyHosts.value[option.host] = {
        token: option.token,
        forum: option.forum || historyHosts.value[option.host]?.forum,
        user: option.user
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
        const { token } = historyHosts.value[host];
        saveData('access_token', token);
        saveData('server_host', host)
        TokenRequest.switchHost(host)
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
