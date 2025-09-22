<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import type { Ref, ComputedRef } from 'vue'

import TokenRequest from '@/lib/token';
import { formatDate, getContentMark } from '@/lib/utils';
import message from '@/lib/message';
import { gotoPost, gotoPortrait } from '@/lib/utils';
import { DIALOG_WIDTH } from '@/lib/constance';
import { SwitchTokenEvent } from '@/lib/data/tokenManager';

interface ConfirmData {
    content: Thread | Post | Comment
    rule_set_name: string
    process_time: number
}

const confirmList = ref<null | ConfirmData[]>(null)
const confirmSelectedDict = ref<{ [key: number]: boolean }>({})
const confirmSelectedCount = ref(0)


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
    const curr = !!confirmSelectedDict.value[pid];
    confirmSelectedDict.value[pid] = !curr;
    confirmSelectedCount.value += curr ? -1 : 1;
}

async function fetchConfirmList() {
    try {
        const response = await TokenRequest.get<BaseResponse<ConfirmData[]>>({
            url: '/api/confirm/get_list'
        })
        confirmList.value = response.data.data;
        clearConfirmSelected()
    } catch {
        message.notify('数据获取失败', message.error)
    }
}

fetchConfirmList()
SwitchTokenEvent.on((token) => {
    if (token) {
        confirmList.value = null
        clearConfirmSelected()
        fetchConfirmList()
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

function confirmSelectedRuleset(action: 'ignore' | 'execute') {
    if (selectedRulesetName.value.length === 0) {
        message.notify('没有选中的规则', message.error)
        return
    }

    message.confirm(`即将${ACTION_DICT[action]}规则${selectedRulesetName.value.map(item => `[${item}]`).join(',')}的内容`, '提示', () => {
        if (!confirmList.value || !selectedRulesetName.value) {
            message.notify('没有内容可以操作', message.error)
            return
        }
        const contents = confirmList.value.filter(item => selectedRulesetName.value.includes(item.rule_set_name)).map(item => item.content)
        ifShowBatchDialog.value = false
        batchconfirm(action, contents)
    })
}


// function gotoDetail(content: Content) {
//     router.push(`/handle-details/1/${content.pid}`)
// }


// vue computed 表示用户是否有选中内容 boolen
const ifSelected = computed(() => {
    return confirmSelectedCount.value > 0

})

function handleConfirmSelected(value: boolean) {
    if (value) {
        confirmSelectedCount.value += 1
    } else {
        confirmSelectedCount.value -= 1
    }
}

const ifShowBatchDialog = ref(false)

const confirmRulesetName = computed(() => {
    if (!confirmList.value) {
        return []
    }
    const rulesetType = confirmList.value.map(item => item.rule_set_name)
    return Array.from(new Set(rulesetType))
})
const selectedRulesetName = ref<string[]>([])

</script>

<template>
    <el-dialog v-model="ifShowBatchDialog" title="请选择要操作的规则" :width="Math.min(DIALOG_WIDTH, 400)"
        @closed="selectedRulesetName = []">
        <el-checkbox-group v-model="selectedRulesetName" style="margin-bottom: 20px;">
            <el-checkbox v-for="name in confirmRulesetName" :value="name" :key="name">
                <el-tag style="font-size: 14px;">{{ name }}</el-tag><br />
            </el-checkbox>
        </el-checkbox-group>
        <div style="display: flex; justify-content: flex-end;">
            <el-button type="primary" @click="ifShowBatchDialog = false">取消
            </el-button>
            <el-button type="success" @click="confirmSelectedRuleset('ignore')">忽略
            </el-button>
            <el-button type="danger" @click="confirmSelectedRuleset('execute')">确认
            </el-button>
        </div>
    </el-dialog>
    <div style="position: absolute; top: 0px; right: 0px; padding: 10px;">
        自动刷新
        <el-checkbox v-model="AutoRefresh.enable.value"></el-checkbox>
        <el-progress v-if="AutoRefresh.enable.value && confirmList && confirmList.length > 0"
            :percentage="AutoRefresh.percentage.value" :show-text="false" />
    </div>
    <div style="max-width: 1000px; position: relative;;flex-grow: 1;">
        <div style="max-width: 600px; padding: 10px;" v-if="confirmList && confirmList.length > 0">
            <h1>确认列表</h1>
            <div>
                <el-button type="primary" v-if="!ifSelected" @click="ifShowBatchDialog = true">批量操作</el-button>
                <el-button type="primary" v-else @click="clearConfirmSelected">取消选择</el-button>
                <el-button type="success" @click="confirmSelected('ignore')"> {{ ifSelected ? '忽略选中' : '忽略所有' }}
                </el-button>
                <el-button type="danger" @click="confirmSelected('execute')"> {{ ifSelected ? '确认选中' : '确认所有' }}
                </el-button>
            </div>
            <el-divider />
            <div v-for="({ content, rule_set_name }, index) in confirmList" style="margin-bottom: 20px;"
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
                            <el-tag style="font-size: 14px;">{{ rule_set_name }}</el-tag>
                        </div>
                    </div>
                    <div class="body">
                        <div style="margin-bottom: 10px; display: flex;">
                            <h3 style="margin: 0; margin-bottom: 10px; flex-grow: 1;">{{ getContentMark(content) }}</h3>
                            <!-- 保留视觉指示器，但不可直接点击（卡片点击控制选中） -->
                            <!-- <div style="align-self: center;">
                                <el-checkbox :model-value="isSelected(content)" disabled />
                            </div> -->
                        </div>
                        <p v-if="content.text" style="margin: 0; word-break: break-all;">
                            <template v-for="(line, index) in content.text.split('\n')" :key="index">
                                {{ line }}<br />
                            </template>
                        </p>
                    </div>
                    <div v-if="content.images.length > 0" class="image-container">
                        <img v-for="image in content.images" :src="TokenRequest.host + '/resources/image/' + image.hash"
                            :key="image.hash" alt="图片" loading="lazy" />
                    </div>
                    <el-divider></el-divider>
                    <div class="card-footer">
                        <div class="select-indicator">
                            <el-checkbox :model-value="isSelected(content)" disabled />
                        </div>
                        <div class="actions">
                            <el-button type="primary" @click.stop="gotoPost(content)">原贴</el-button>
                            <el-button type="success" @click.stop="confirm('ignore', content, index)">忽略</el-button>
                            <el-button type="danger" @click.stop="confirm('execute', content, index)">确认</el-button>
                        </div>
                    </div>
                </el-card>
            </div>
        </div>

        <div v-else-if="confirmList"
            style="max-width: 600px; padding: 10px; display: flex; justify-self: center; align-items: center; flex-wrap: wrap;">
            <div style="width: 350px; text-align: center;">
                <h2>没有需要确认的项目</h2>
                <el-progress v-if="AutoRefresh.enable.value" :percentage="AutoRefresh.percentage.value"
                    :show-text="false" />
            </div>
        </div>
        <div v-else style="max-width: 600px; padding: 10px; display: flex; justify-self: center; align-items: center;"
            v-loading="true">
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
    box-shadow: 0 8px 18px rgba(0,0,0,0.06);
}

/* 选中状态样式 */
.confirm-card-selected {
    border: 1px solid rgba(56,142,255,0.8);
    background-color: #f5fbff;
    box-shadow: 0 8px 22px rgba(56,142,255,0.06);
}

/* 新增：卡片底栏与勾选指示器样式 */
.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.select-indicator {
    display: flex;
    align-items: center;
    pointer-events: none; /* 防止覆盖卡片点击 */
}

/* 美化：仅作用于底栏指示器中的 el-checkbox */
.card-footer .select-indicator {
    /* 可按需微调主题色与尺寸 */
    --indicator-size: 18px;
    --indicator-radius: 6px;
    --indicator-border: 2px;
    --indicator-accent: #388eff;
    --indicator-bg: #f7f9fc;
    --indicator-border-color: #c8d3e3;
}

/* 去除禁用态的灰化，但仍不可点击 */
.card-footer .select-indicator :deep(.el-checkbox.is-disabled) {
    opacity: 1;
}

/* 复选框主体尺寸与基础样式 */
.card-footer .select-indicator :deep(.el-checkbox__inner) {
    width: var(--indicator-size);
    height: var(--indicator-size);
    border-radius: var(--indicator-radius);
    border: var(--indicator-border) solid var(--indicator-border-color);
    background-color: var(--indicator-bg);
    transition: all .18s ease;
    box-shadow: inset 0 1px 2px rgba(0,0,0,.03);
    position: relative;             /* 新增：让 ::after 基于容器定位 */
    display: inline-flex;           /* 新增：为将来内容对齐预留 */
    align-items: center;            /* 新增 */
    justify-content: center;        /* 新增 */
}

/* 勾选态高亮 */
.card-footer .select-indicator :deep(.is-checked .el-checkbox__inner) {
    background-color: var(--indicator-accent);
    border-color: var(--indicator-accent);
    box-shadow: 0 4px 10px rgba(56,142,255,.18);
}

/* 关闭 EP 默认的打勾描边，避免与自定义“✓”重叠 */
.card-footer .select-indicator :deep(.el-checkbox__inner::before) {
  content: none;
  display: none !important;
}

/* 未选中：隐藏勾，保持居中基准（同时重置 EP 默认样式） */
.card-footer .select-indicator :deep(.el-checkbox__inner::after) {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  color: #fff;
  font-weight: 700;
  font-size: calc(var(--indicator-size) * 0.8);
  line-height: 1;
  transform: translate(-50%, -56%) scale(.9);
  opacity: 0;
  transition: transform .16s ease-out, opacity .12s ease-out;

  /* 重置 Element Plus 默认 ::after 勾形样式 */
  border: 0 !important;
  width: auto !important;
  height: auto !important;
  background: transparent !important;
  box-sizing: content-box !important;
}

/* 选中：显示“✓”，覆盖 EP 默认的旋转/缩放 */
.card-footer .select-indicator :deep(.el-checkbox__input.is-checked .el-checkbox__inner::after) {
  content: "✓";
  opacity: 1;
  transform: translate(-50%, -56%) scale(1);
}

.actions {
    display: flex;
    gap: 8px;
}
</style>
