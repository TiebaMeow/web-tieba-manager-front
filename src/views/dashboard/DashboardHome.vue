<script setup lang="ts">
import CustomStatistic from '@/components/CustomStatistic.vue';
import TokenRequest from '@/lib/token';
import { fetchHomeInfo, getHomeInfo } from '@/lib/data/common';
import message from '@/lib/message';
const homeInfo = getHomeInfo()

function changeUserState() {
    if (!homeInfo.value) {
        message.notify('信息未加载，请尝试刷新页面', message.error)
        return
    }
    TokenRequest.post<BaseResponse<boolean>>({
        url: `/api/user/${homeInfo.value.enable ? 'disable' : 'enable'}`,
    }).then(response => {
        if (response.data.data) {
            message.notify('操作成功', message.success)
            fetchHomeInfo()
        } else {
            message.notify('操作失败', message.error)
        }
    })
}
</script>

<template>
    <div style="max-width: 1000px; flex-grow: 1;" v-if="homeInfo">
        <h2>基础信息</h2>

        <div style="width: 350px; display: flex;margin-bottom: 30px;">
            <custom-statistic title="监控贴吧" :value="homeInfo.forum || '未设置'" style="width: 50%;" />
        </div>

        <h2>运行信息</h2>

        <div style="display: flex; margin-bottom: 30px;">
            <div style="width: 140px;">
                <custom-statistic title="运行状态" :value="homeInfo.enable ? '正在运行' : '未运行'" />
            </div>
            <div style="position: relative;">

                <el-button style="position: absolute; bottom: 0;" :type="homeInfo.enable ? 'danger' : 'success'"
                    @click="changeUserState"> {{
                        homeInfo.enable ? '停止' : '启动' }}</el-button>
            </div>
        </div>
        <h2>账号信息</h2>

        <div style="display: flex; margin-bottom: 40px;" v-if="homeInfo.account?.status === 'SUCCESS'">
            <div style="width: 140px;">
                <custom-statistic title="使用账号" :value="homeInfo.account.nick_name" style="margin-bottom: 20px;" />
                <custom-statistic title="贴吧会员" :value="homeInfo.account.is_vip ? '是' : '否'" />
            </div>
            <div style="display: flex;justify-content: center;align-items: center; width: 100px;">
                <a :href="'https://tieba.baidu.com/home/main?id=' + homeInfo.account.portrait" target="_blank">
                    <img style="border-radius: 50%;" width="90px"
                        :src="TokenRequest.host + '/resources/portrait/' + homeInfo.account.portrait" alt="">
                </a>
            </div>
        </div>
        <div style="display: flex; margin-bottom: 40px;" v-else-if="homeInfo.account?.status === 'MISSING_COOKIE'">
            <div>
                <custom-statistic title="登录状态" value="未设置 BDUSS 或 STOKEN" style="margin-bottom: 20px;" />
            </div>
        </div>
        <div style="display: flex; margin-bottom: 40px;" v-else-if="homeInfo.account?.status === 'FAILED'">
            <div>
                <custom-statistic title="登录状态" value="登陆失败" style="margin-bottom: 20px;" />
                <custom-statistic title="失败原因" :value="homeInfo.account.failed_reason || '未知'" />
            </div>
        </div>
        <div v-else>
            未设置账号
        </div>
    </div>
    <div v-else-if="homeInfo === null" v-loading="true">
        Loading...
    </div>
    <div v-else>
        <h2>加载失败，请尝试刷新页面</h2>
    </div>
</template>
