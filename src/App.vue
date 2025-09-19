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
        <el-icon v-if="isDashboardRoute" style="margin-right: 10px;" @click="ifShowSidebar = !ifShowSidebar">
            <i-ep-fold v-if="ifShowSidebar" />
            <i-ep-expand v-else />
        </el-icon>
        WTM Console
        <div style="display: flex; flex-grow: 1; justify-content: flex-end; padding-right: 40px;">
            <div style="cursor: pointer; display: flex; align-items: center; margin-right: 20px;"
                @click="ifShowSwitch = true">
                <el-icon style="margin-right: 5px;"><i-ep-Switch /></el-icon>
                切换
            </div>
            <div v-show="isDashboardRoute" style="cursor: pointer; display: flex; align-items: center;"
                @click="logout(false)">
                <el-icon style="margin-right: 5px;"><i-ep-SwitchButton /></el-icon>
                登出
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
}
</style>
