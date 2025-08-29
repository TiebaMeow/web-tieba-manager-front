<script setup lang="ts">
import { ref, computed } from 'vue';
import { getViewMode, saveData } from './lib/utils';
import { useRoute } from 'vue-router';
import message from './lib/message';
import { deleteHost, sequenceHistoryHosts, switchHostByHistory } from './lib/data/hostManager';
import router from './router';
import TokenRequest from './lib/token';
import { DIALOG_WIDTH } from './lib/constance';

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


function logout(deleteHistory: boolean = false) {
    message.confirm(
        '即将登出', '提示',
        () => {
            if (deleteHistory) {
                deleteHost(TokenRequest.host)
            }
            router.push('/login')
            saveData('access_token', '')
        }
    )
}

function handleDeleteHost(host: string) {
    if (TokenRequest.host === host) {
        logout(true)
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
        {{ sequenceHistoryHosts }}
        <el-table :data="sequenceHistoryHosts">
            <el-table-column prop="host" label="服务">
                <template #default="scope">
                    <div style="text-align: center;">
                        {{ scope.row.host }}
                        <template v-if="scope.row.forum || scope.row.user">
                            <br />
                            {{ scope.row.user }}
                            <template v-if="scope.row.forum">
                                @{{ scope.row.forum }}
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
    <router-view />
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
