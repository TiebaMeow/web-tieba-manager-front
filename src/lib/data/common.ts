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
/*
undefined: 未加载
null: 正在加载
false: 加载失败
*/
const homeInfo = ref<HomeInfo | false | undefined | null>(undefined)

async function fetchHomeInfo() {
    try {
        homeInfo.value = null
        const response = await TokenRequest.get<BaseResponse<HomeInfo>>({
            url: '/api/user/info'
        })
        if (response.data.code === 200) {
            homeInfo.value = response.data.data
        } else {
            homeInfo.value = false
        }
    } catch {
        homeInfo.value = false
    }
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
