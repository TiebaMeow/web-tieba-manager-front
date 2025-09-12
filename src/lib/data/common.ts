import { ref } from "vue"
import TokenRequest from "../token"
import { setForum, currToken } from "./tokenManager"
import { SwitchTokenEvent } from "./tokenManager"

interface HomeInfo {
    enable: boolean
    forum: string
    account: {
        is_vip: boolean
        portrait: string
        user_name: string
        nick_name: string
    } | null
}

const homeInfo = ref<RefResponse<HomeInfo>>(undefined)

async function fetchHomeInfo() {
    await TokenRequest.fetch(homeInfo, {
        url: '/api/user/info'
    })
    if (homeInfo.value && homeInfo.value.forum) {
        setForum(currToken.value, homeInfo.value.forum)
    }
}


function getHomeInfo() {
    if (!homeInfo.value && homeInfo.value !== null) {
        fetchHomeInfo()
    }
    return homeInfo
}

SwitchTokenEvent.on((token) => {
    if (
        token) {
        fetchHomeInfo()
    } else {
        homeInfo.value = undefined
    }
})

export {
    fetchHomeInfo,
    getHomeInfo
}
