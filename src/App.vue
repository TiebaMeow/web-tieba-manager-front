<script setup lang="ts">
import { ref, computed } from 'vue';
import { getViewMode } from './lib/utils';
import { useRoute, useRouter } from 'vue-router';
import message from './lib/message';
import { currToken, currTokenData, deleteToken, sequenceHistoryTokens, switchTokenByHistory } from './lib/data/tokenManager';
import { DIALOG_WIDTH } from './lib/constance';
import SideBar from './views/SideBar.vue';
import TokenRequest from './lib/token';

const router = useRouter()
const route = useRoute()

const ifShowSidebar = ref(!(getViewMode(900) === 'mobile'))
const ifShowSwitch = ref(false)


const isDashboardRoute = computed(() => {
    for (const r of route.matched) {
        if (r.name == 'dashboard') {
            return true
        }
    }
    return false
})


function logout(deleteTokenHistory: boolean = false, text: string = '即将登出') {
    message.confirm(
        text, '提示',
        () => {
            if (ifShowSwitch.value) {
                ifShowSwitch.value = false
            }
            TokenRequest.logout(deleteTokenHistory)
        }
    )
}

function handleDeleteToken(token: string) {
    if (currToken.value === token) {
        logout(true, '即将删除并登出正在使用的服务')
    } else {
        deleteToken(token)
    }
}

function handleSwitchToken(token: string) {
    if (switchTokenByHistory(token)) {
        if (route.meta.system && !currTokenData.value?.system_access || ['login', 'register'].includes(route.name as string)) {
            // 切换到的账号没有系统权限，且当前页面需要系统权限，或当前页面为登录注册页
            // 则跳转到控制台首页
            router.push('/dashboard')
        }
        message.notify('切换成功', message.success)
        ifShowSwitch.value = false
    } else {
        message.notify('切换失败，请稍后再试', message.error)
    }
}
</script>

<template>
    <el-dialog v-model="ifShowSwitch" title="请选择服务" :width="Math.min(DIALOG_WIDTH, 500)">
        <el-table :data="sequenceHistoryTokens">
            <el-table-column prop="token" label="服务">
                <template #default="scope">
                    <div style="text-align: center;">
                        {{ scope.row.host }}
                        <template v-if="scope.row.forum || scope.row.user">
                            <br />
                            {{ scope.row.user }}<template v-if="scope.row.forum">@{{ scope.row.forum }}
                            </template>
                        </template>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="操作" :width="135">
                <template #default="scope">
                    <el-button size="small" type="danger" @click="handleDeleteToken(scope.row.token)">删除</el-button>
                    <el-button size="small" type="primary" @click="handleSwitchToken(scope.row.token)"
                        :disabled="currToken === scope.row.token">切换</el-button>
                </template>
            </el-table-column>
        </el-table>
    </el-dialog>
    <div class="header">
        <div style="display: flex; align-items: center;">
            <el-icon v-if="isDashboardRoute" style="margin-right: 10px;" @click="ifShowSidebar = !ifShowSidebar">
                <i-ep-fold v-if="ifShowSidebar" />
                <i-ep-expand v-else />
            </el-icon>
            <div>
                WTM Console
            </div>
        </div>
        <div style="display: flex; align-items: center;">
            <div style="cursor: pointer; display: flex; align-items: center; margin-right: 10px;"
                @click="ifShowSwitch = true">
                <el-icon style="margin-right: 5px;"><i-ep-Switch /></el-icon>
                切换
            </div>
            <div v-show="isDashboardRoute" style="cursor: pointer; display: flex; align-items: center"
                @click="logout(false)">
                <el-icon style="margin-right: 5px;"><i-ep-SwitchButton /></el-icon>
                登出
            </div>
            <el-divider direction="vertical" style="margin: 0 10px;" />
            <div style="height: 20px; width: 20px; display: flex; align-items: center; margin-right: 40px;">
                <a href="https://github.com/TiebaMeow/WebTiebaManager" target="_blank"
                    style="display: flex; align-items: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" style="height: 20px">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                            fill="#24292f" />
                    </svg>
                </a>
            </div>
        </div>
    </div>
    <div v-if="isDashboardRoute" style="display: flex; height: calc(100vh - 50px);">
        <SideBar v-model="ifShowSidebar" />
        <el-scrollbar style="height: 100%; width: 100%; padding: 0 20px">
            <div style="display: flex; justify-content: center; width: calc(100%-40px); margin: 20px 20px 0 20px;">
                <RouterView />
            </div>
        </el-scrollbar>
    </div>
    <router-view v-else />
</template>
<style>
html,
body {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
}

:root {
    --bolder-color: rgb(217, 217, 217);
}


body.el-popup-parent--hidden {
    width: 100% !important;
}

.center {
    display: flex;
    justify-content: center;
}

.center-all {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
}
</style>
<style scoped>
.header {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    font-size: 20px;
    border-bottom: 1px solid rgb(217, 217, 217);
    justify-content: space-between;
}
</style>
