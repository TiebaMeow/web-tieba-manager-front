<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import type { Ref, ComputedRef } from 'vue'

import TokenRequest from '@/lib/token';
import { formatDate, getContentMark, iterateObject } from '@/lib/utils';
import message from '@/lib/message';
import { gotoPost, gotoPortrait } from '@/lib/utils';
import { DIALOG_WIDTH } from '@/lib/constance';
import { SwitchTokenEvent, currToken } from '@/lib/data/tokenManager';
import { requestBrowserNotification, browserNotify } from '@/lib/notification';
import { getData, saveData } from '@/lib/utils';
import { Refresh } from '@element-plus/icons-vue';

interface ConfirmData {
    content: Thread | Post | Comment
    rule_name: string
    process_time: number
}

const confirmList = ref<null | ConfirmData[]>(null)
const confirmSelectedDict = ref<{ [key: number]: boolean }>({})
const confirmSelectedCount = ref(0)
const loading = ref(false)


const AutoRefresh = new class AutoRefresh {
    INTERVAL: Ref<number> // 单位 (秒)
    curr_time: Ref<number>
    enable: Ref<boolean>
    percentage: ComputedRef<number>
    stop: boolean // 用于停止循环

    constructor() {
        this.INTERVAL = ref(60)
        this.curr_time = ref(0)
        this.enable = ref(true)
        this.stop = false
        this.percentage = computed(() => {
            return 100 * this.curr_time.value / this.INTERVAL.value
        })
        this.loop()
    }

    loop() {
        this.curr_time.value += 1
        if (this.curr_time.value >= this.INTERVAL.value) {
            this.curr_time.value = 0
            if (this.enable.value) {
                fetchConfirmList()
            }
        }
        if (this.stop) {
            return
        }
        setTimeout(() => this.loop(), 1000)
    }
}
onUnmounted(() => {
    AutoRefresh.stop = true
})

function clearConfirmSelected() {
    confirmSelectedDict.value = {};
    confirmList.value?.forEach(item => {
        confirmSelectedDict.value[item.content.pid] = false;
    });
    confirmSelectedCount.value = 0;

}


function removeSpecialConfirmSelected(content: Content) {
    if (confirmSelectedDict.value[content.pid]) {
        confirmSelectedDict.value[content.pid] = false;
        confirmSelectedCount.value -= 1;
    }
}

// 检查是否选中
function isSelected(content: Content) {
    return !!confirmSelectedDict.value[content.pid];
}

// 切换选中状态
function toggleSelect(content: Content) {
    const pid = content.pid;
    const selected = !!confirmSelectedDict.value[pid];
    confirmSelectedDict.value[pid] = !selected;
    confirmSelectedCount.value += selected ? -1 : 1;
}

// vue computed 表示用户是否有选中内容 boolean
const ifSelected = computed(() => confirmSelectedCount.value > 0)


async function fetchConfirmList() {
    loading.value = true
    try {
        const response = await TokenRequest.get<BaseResponse<ConfirmData[]>>({
            url: '/api/confirm/get_list'
        })
        const fetchPids = new Set<number>()
        response.data.data.forEach(item => {
            fetchPids.add(item.content.pid)
        })

        // 清理不存在的选中项
        iterateObject(confirmSelectedDict.value, (key, value) => {
            const pid = Number(key)
            if (!fetchPids.has(pid)) {
                delete confirmSelectedDict.value[pid]
                if (value) {
                    confirmSelectedCount.value -= 1
                }
            }
        })



        // 处理新确认通知
        if (confirmList.value !== null) {
            // 首次加载不通知
            const existedPids = new Set<number>()
            if (confirmList.value) {
                confirmList.value.forEach(item => {
                    existedPids.add(item.content.pid)
                })
            }
            const newConfirms = response.data.data.filter(item => !existedPids.has(item.content.pid))
            if (ifNotifyNewConfirm.value && newConfirms.length > 0) {
                newConfirms.forEach(item => {
                    browserNotify('有新的确认内容', {
                        body: `${getContentMark(item.content)} 来自规则【${item.rule_name}】`,
                        icon: TokenRequest.host + '/resources/portrait/' + item.content.user.portrait,
                        tag: String(item.content.pid)
                    })
                })
            }
        }

        confirmList.value = response.data.data
    } catch {
        message.notify('数据获取失败', message.error)
    } finally {
        loading.value = false
    }
}

fetchConfirmList()
SwitchTokenEvent.on((token) => {
    if (token) {
        confirmList.value = null
        clearConfirmSelected()
        fetchConfirmList()
        refreshIfNotifyNewConfirm()
    } else {
        confirmList.value = []
        clearConfirmSelected()
    }
})

async function confirm(action: 'ignore' | 'execute', content: Content, index: number) {
    const response = await TokenRequest.post<BaseResponse<boolean>>({
        url: '/api/confirm/confirm',
        data: {
            action,
            pid: content.pid
        }
    })
    if (response.data.code === 200) {
        message.notify(response.data.message, message.success)
        if (confirmList.value) {
            confirmList.value.splice(index, 1)
        }
        removeSpecialConfirmSelected(content)
    } else {
        message.notify(response.data.message, message.error)
    }
}

async function batchconfirm(action: 'ignore' | 'execute', contents: Content[]) {
    const pids: number[] = []
    contents.forEach(content => {
        pids.push(content.pid)
    })

    const response = await TokenRequest.post<BaseResponse<boolean>>({
        url: '/api/confirm/confirm',
        data: {
            action,
            pid: pids
        }
    })
    if (response.data.code === 200) {
        message.notify(response.data.message, message.success)
        if (confirmList.value) {
            confirmList.value = confirmList.value.filter(item => !pids.includes(item.content.pid))
        }
        clearConfirmSelected()
    } else {
        message.notify(response.data.message, message.error)
    }
}

const ACTION_DICT = {
    'ignore': '忽略',
    'execute': '确认'

}

function confirmSelected(action: 'ignore' | 'execute') {
    message.confirm(`即将${ACTION_DICT[action]}${ifSelected.value ? '选中' : '全部'}内容`, '提示', () => {
        if (!confirmList.value) {
            message.notify('没有内容可以操作', message.error)
            return
        }
        const contents = confirmList.value.map(item => item.content)
        batchconfirm(action, ifSelected.value ? contents.filter(item => confirmSelectedDict.value[item.pid]) : contents)

    })
}

function confirmSelectedRule(action: 'ignore' | 'execute') {
    if (selectedRuleName.value.length === 0) {
        message.notify('没有选中的规则', message.error)
        return
    }

    message.confirm(`即将${ACTION_DICT[action]}规则${selectedRuleName.value.map(item => `[${item}]`).join(',')}的内容`, '提示', () => {
        if (!confirmList.value || !selectedRuleName.value) {
            message.notify('没有内容可以操作', message.error)
            return
        }
        const contents = confirmList.value.filter(item => selectedRuleName.value.includes(item.rule_name)).map(item => item.content)
        ifShowBatchDialog.value = false
        batchconfirm(action, contents)
    })
}

const ifShowBatchDialog = ref(false)

const confirmRuleName = computed(() => {
    if (!confirmList.value) {
        return []
    }
    const ruleType = confirmList.value.map(item => item.rule_name)
    return Array.from(new Set(ruleType))
})
const selectedRuleName = ref<string[]>([])

const ifNotifyNewConfirm = ref(false)


function refreshIfNotifyNewConfirm() {
    const notificationSettings = getData<Record<string, boolean>>('notificationSettings')
    if (notificationSettings && notificationSettings[currToken.value] !== undefined) {
        ifNotifyNewConfirm.value = notificationSettings[currToken.value]
        if (ifNotifyNewConfirm.value) {
            // 检查权限
            requestBrowserNotification().then(permission => {
                if (permission !== 0) {
                    ifNotifyNewConfirm.value = false
                }
            })
        }
    }
}

refreshIfNotifyNewConfirm()


async function setNotification(enable: boolean) {
    const data = getData<Record<string, boolean>>('notificationSettings') || {}
    if (!enable) {
        data[currToken.value] = false
        saveData('notificationSettings', data)
        ifNotifyNewConfirm.value = false
        return
    }
    const permission = await requestBrowserNotification()
    if (permission === 0) {
        ifNotifyNewConfirm.value = true
        data[currToken.value] = true
        saveData('notificationSettings', data)
    } else if (permission === -2) {
        ifNotifyNewConfirm.value = false
        message.notify('浏览器通知权限被拒绝，无法启用通知', message.error)
    } else if (permission === -1) {
        ifNotifyNewConfirm.value = false
        message.notify('浏览器不支持通知功能，无法启用通知', message.error)
    } else {
        ifNotifyNewConfirm.value = false
        message.notify('遇到意外错误，请联系管理员', message.error)
    }

}


</script>

<template>
    <el-dialog v-model="ifShowBatchDialog" title="请选择要操作的规则" :width="Math.min(DIALOG_WIDTH, 400)"
        @closed="selectedRuleName = []">
        <el-checkbox-group v-model="selectedRuleName" style="margin-bottom: 20px;">
            <el-checkbox v-for="name in confirmRuleName" :value="name" :key="name">
                <el-tag style="font-size: 14px;">{{ name }}</el-tag><br />
            </el-checkbox>
        </el-checkbox-group>
        <div style="display: flex; justify-content: flex-end;">
            <el-button type="primary" @click="ifShowBatchDialog = false">取消
            </el-button>
            <el-button type="success" @click="confirmSelectedRule('ignore')">忽略
            </el-button>
            <el-button type="danger" @click="confirmSelectedRule('execute')">确认
            </el-button>
        </div>
    </el-dialog>
    <div style="position: absolute; top: 0px; right: 0px; padding: 10px;">
        <div>
            推送新确认
            <el-checkbox :model-value="ifNotifyNewConfirm" @update:model-value="setNotification"></el-checkbox>
        </div>
        <div>
            自动刷新
            <el-checkbox v-model="AutoRefresh.enable.value"></el-checkbox>
            <el-progress v-if="AutoRefresh.enable.value && confirmList" :percentage="AutoRefresh.percentage.value"
                :show-text="false" />
        </div>
    </div>
    <div style="max-width: 1000px; position: relative;flex-grow: 1;">
        <div style="max-width: 600px; padding: 10px;" v-if="confirmList && confirmList.length > 0">
            <h1 style="margin-bottom: 5px;">确认列表</h1>
            <div class="sticky-bar">
                <el-button type="primary" v-if="!ifSelected" @click="ifShowBatchDialog = true">批量操作</el-button>
                <el-button type="primary" v-else @click="clearConfirmSelected">取消选择</el-button>
                <el-button type="success" @click="confirmSelected('ignore')"> {{ ifSelected ? '忽略选中' : '忽略所有' }}
                </el-button>
                <el-button type="danger" @click="confirmSelected('execute')"> {{ ifSelected ? '确认选中' : '确认所有' }}
                </el-button>
                <el-button type="primary" :icon="Refresh" @click="fetchConfirmList" />
            </div>
            <!-- <el-divider /> -->
            <div v-loading="loading">
                <div v-for="({ content, rule_name }, index) in confirmList" style="margin-bottom: 20px;"
                    :key="content.pid">
                    <!-- 点击整张卡片切换选中 -->
                    <el-card :class="{ 'confirm-card-selected': isSelected(content) }" @click="toggleSelect(content)">
                        <div class="head">
                            <div class="avatar-container" @click.stop="gotoPortrait(content.user.portrait)">
                                <img :src="TokenRequest.host + '/resources/portrait/' + content.user.portrait" alt="头像"
                                    loading="lazy" />
                            </div>
                            <div style="display: flex;flex: 1 0 auto;flex-direction: column">
                                <span>{{ content.user.nick_name }} {{ content.user.level }}级</span>
                                <span style="color: grey">{{ formatDate(content.create_time) }}</span>
                            </div>
                            <div style="display: flex; flex-grow: 1; justify-content: flex-end;">
                                <el-tag style="font-size: 14px;">{{ rule_name }}</el-tag>
                            </div>
                        </div>
                        <div class="body">
                            <div style="margin-bottom: 10px; display: flex;">
                                <h3 style="margin: 0; margin-bottom: 10px; flex-grow: 1;">{{ getContentMark(content) }}
                                </h3>
                            </div>
                            <p v-if="content.text" style="margin: 0; word-break: break-all;">
                                <template v-for="(line, index) in content.text.split('\n')" :key="index">
                                    {{ line }}<br />
                                </template>
                            </p>
                        </div>
                        <div v-if="content.images.length > 0" class="image-container">
                            <img v-for="image in content.images"
                                :src="TokenRequest.host + '/resources/image/' + image.hash" :key="image.hash" alt="图片"
                                loading="lazy" />
                        </div>
                        <el-divider></el-divider>
                        <div class="card-footer">
                            <div>
                                <el-checkbox :model-value="isSelected(content)" />
                            </div>
                            <div>
                                <el-button type="primary" @click.stop="gotoPost(content)">原贴</el-button>
                                <el-button type="success" @click.stop="confirm('ignore', content, index)">忽略</el-button>
                                <el-button type="danger" @click.stop="confirm('execute', content, index)">确认</el-button>
                            </div>
                        </div>
                    </el-card>
                </div>
            </div>
        </div>

        <div v-else-if="confirmList"
            style="max-width: 600px; padding: 10px; display: flex; justify-self: center; align-items: center; flex-wrap: wrap;">
            <div style="width: 350px; text-align: center;">
                <h2>没有需要确认的项目</h2>
            </div>
        </div>
        <div v-else style="max-width: 600px; padding: 10px; display: flex; justify-self: center; align-items: center;"
            v-loading="loading">
            <h2>加载中...</h2>
        </div>
    </div>
</template>


<style scoped>
.head {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.body {
    width: 100%;
}

.avatar-container {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    background: black;
    margin-right: 10px;
    overflow: hidden;
}

.avatar-container img {
    width: 100%;
    height: 100%;
}

.image-container {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
}

.image-container img {
    height: 110px;
    margin: 0 10px 10px 0;
}

/* 整卡可点击样式、hover 与 选中样式 */
.el-card {
    cursor: pointer;
    transition: box-shadow .18s ease, transform .12s ease, border-color .12s ease, background-color .12s ease;
}

.el-card:hover {
    /* transform: translateY(-3px); */
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
}

/* 选中状态样式 */
.confirm-card-selected {
    border: 1px solid rgba(56, 142, 255, 0.8);
    background-color: #f5fbff;
    box-shadow: 0 8px 22px rgba(56, 142, 255, 0.06);
}

/* 新增：卡片底栏与勾选指示器样式 */
.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>
<style>
.card-footer .el-checkbox {
    /* default 14px */
    --el-checkbox-input-height: 18px;
    --el-checkbox-input-width: 18px;
    --el-checkbox-font-size: 18px;

}

.card-footer .el-checkbox__inner:after {
    /* default width 3px height 7px border 1px */
    width: 4px;
    height: 9px;
    border: 2px solid transparent;
    border-left: 0;
    border-top: 0;
}
</style>
