<script setup lang="ts">
import { ref, computed } from 'vue';
import { getViewMode, saveData } from './lib/utils';
import { useRoute, useRouter } from 'vue-router';
import message from './lib/message';
import { deleteHost, sequenceHistoryHosts, switchHostByHistory } from './lib/data/hostManager';
import TokenRequest from './lib/token';
import { DIALOG_WIDTH } from './lib/constance';
import SideBar from './views/SideBar.vue';

const route = useRoute()
const router = useRouter()

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


function logout(deleteHistory: boolean = false, text: string = '即将登出') {
    message.confirm(
        text, '提示',
        () => {
            if (deleteHistory) {
                deleteHost(TokenRequest.host)
            }
            if (ifShowSwitch.value) {
                ifShowSwitch.value = false
            }
            router.push('/login')
            saveData('access_token', '')
        }
    )
}

function handleDeleteHost(host: string) {
    if (TokenRequest.host === host) {
        logout(true, '即将删除并登出正在使用的服务')
    } else {
        deleteHost(host)
    }
}

function handleSwitchHost(host: string) {
    if (switchHostByHistory(host)) {
        ifShowSwitch.value = false
    }
}
</script>

<template>
    <el-dialog v-model="ifShowSwitch" title="请选择服务" :width="Math.min(DIALOG_WIDTH, 500)">
        <el-table :data="sequenceHistoryHosts">
            <el-table-column prop="host" label="服务">
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
                    <el-button size="small" type="danger" @click="handleDeleteHost(scope.row.host)">删除</el-button>
                    <el-button size="small" type="primary" @click="handleSwitchHost(scope.row.host)"
                        :disabled="TokenRequest.host === scope.row.host">切换</el-button>
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
