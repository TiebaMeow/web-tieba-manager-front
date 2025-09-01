import { ref } from "vue"
import TokenRequest from "../token"

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
}


function getHomeInfo() {
    if (!homeInfo.value && homeInfo.value !== null) {
        fetchHomeInfo()
    }
    return homeInfo
}

export {
    fetchHomeInfo,
    getHomeInfo
}
