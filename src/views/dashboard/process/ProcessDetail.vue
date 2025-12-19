<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';
import { onBeforeRouteUpdate, useRoute, useRouter, type RouteLocation } from 'vue-router';
import axios from 'axios';

import message from '@/lib/message';
import { conditionInfoDict, getRules } from '@/lib/data/rule';

import TokenRequest from '@/lib/token';

import { formatDate, getContentMark, gotoPost } from '@/lib/utils';
import { SwitchTokenEvent } from '@/lib/data/tokenManager'

// TODO conditionInfo获取的明确化
getRules();
const route = useRoute();
const router = useRouter();

const UNPROCESSED_TEXT = '<unprocessed>';

function getPid(r: RouteLocation) {
    if (!r.params.pid) {
        router.push('/process/index');
        return 0
    }
    const pid = parseInt(r.params.pid.toString());
    if (isNaN(pid)) {
        router.push('/process/index');
        return 0
    }
    return pid;
}


interface RuleContext {
    name: string
    whitelist: boolean
    result: boolean
    conditions: Array<number>,
    step_status: number | Array<Array<number>> | null
}


interface Context {
    result_rule: string | null
    is_whitelist: boolean
    process_time: number
    content: Content
    rules: Array<RuleContext>
    conditions: Array<{
        type: string
        context: string
        key: string | null
    }>
}


const detail = ref<RefResponse<Context>>(undefined);
const invalidDetail = computed(() => {
    return !detail.value || detail.value.content.floor === 0
})

async function fetchDetail(pid: number) {
    await TokenRequest.fetch(detail, {
        url: '/api/process/detail',
        data: { pid }
    })
    if (detail.value) {
        currRule.value = detail.value.result_rule || '';
    }
}
fetchDetail(getPid(route));

function styleDetermine(rule: RuleContext, rci: number): "success" | "danger" | "info" {
    const step_status = rule.step_status;
    if (step_status === null || step_status === undefined) {
        return rule.result ? "success" : "info";
    }
    if (Array.isArray(step_status)) {
        if (step_status[1].includes(rci)) {
            return "danger";
        } else if (step_status[0].includes(rci)) {
            return "success";
        } else {
            return "info";
        }
    } else {
        if (rci < step_status) {
            return "success";
        } else if (rci === step_status) {
            return "danger";
        } else {
            return "info";
        }
    }
}

const contexts = computed(() => {
    if (!detail.value) {
        return [];
    }
    return detail.value.rules.map(rule => {
        return {
            rule,
            conditions: rule.conditions.map((ci, rci) => {
                /*
                ci -> condition index 表示对于conditions数组的索引
                rci -> rule condition index 表示在当前rule中的序号
                */
                if (!detail.value) {
                    throw new Error('detail is null');
                }
                const c = detail.value.conditions[ci];
                const info = conditionInfoDict.value[c.type];
                return {
                    type: c.type,
                    name: info ? info.name : c.type,
                    context: c.context,
                    key: c.key,
                    style: styleDetermine(rule, rci)
                };
            })
        }
    });
})
const hitRuleIndex = computed(() => {
    if (!detail.value) {
        return -1;
    }
    for (let i = 0; i < detail.value.rules.length; i++) {
        if (detail.value.rules[i].result) {
            return i;
        }
    }
    return -1;
})

const currRule = ref('')

function refreshData(r: RouteLocation = route) {
    const pid = getPid(r);
    if (pid) {
        fetchDetail(pid);
        getRules();
    }
}

onBeforeRouteUpdate((to) => {
    refreshData(to);
})
onUnmounted(SwitchTokenEvent.on(() => {
    refreshData();
}))

const showReprocessDialog = ref(false);
const executeReprocessOptions = ref<{
    execute_operation: boolean,
    execute_confirm: boolean
}>({
    execute_operation: false,
    execute_confirm: false
});
const reprocessResult = ref<string | null>(null);
const reprocessStatus = ref<'idle' | 'processing' | 'done' | 'failed'>('idle');

function openReprocessDialog() {
    executeReprocessOptions.value = {
        execute_operation: false,
        execute_confirm: false
    };
    reprocessResult.value = null;
    reprocessStatus.value = 'idle';
    showReprocessDialog.value = true;
}

async function reprocess() {
    if (!detail.value) {
        return;
    }
    reprocessStatus.value = 'processing';
    try {
        const response = await TokenRequest.post<BaseResponse<{
            result_rule: string | null
            context: Context | null
        }>>({
            url: '/api/process/reprocess',
            data: {
                pid: detail.value.content.pid,
                execute_operation: executeReprocessOptions.value.execute_operation,
                execute_confirm: executeReprocessOptions.value.execute_confirm,
            }
        })
        if (response.status === 200 && response.data) {
            reprocessResult.value = response.data.data.result_rule
            currRule.value = response.data.data.result_rule || '';

            if (response.data.data.context) {
                detail.value = {
                    ...response.data.data.context,
                    content: detail.value.content
                }
            } else {
                refreshData();
            }


            reprocessStatus.value = 'done';
        } else {
            message.notify(`重新处理失败: ${response.data.message || '未知错误'}`, message.error);

            reprocessStatus.value = 'failed';
        }
    } catch (e) {
        if (axios.isAxiosError(e)) {
            message.notify(`重新处理失败: ${e.response?.data?.message || e.message}`, message.error);
        } else {
            message.notify(`重新处理失败: ${String(e)}`, message.error);
        }
        reprocessStatus.value = 'failed';
        return;
    }
}

</script>

<template>
    <el-dialog title="重新处理" v-model="showReprocessDialog" :width="400">
        <span>确认要重新处理该内容吗？</span>
        <div style="margin-top: 10px;">
            <el-checkbox v-model="executeReprocessOptions.execute_operation">
                执行处理操作
            </el-checkbox>
            <el-checkbox v-model="executeReprocessOptions.execute_confirm">
                执行前确认
            </el-checkbox>
        </div>
        <div style="margin-top: 20px;" v-if="reprocessStatus !== 'idle'">
            <div v-if="reprocessStatus === 'processing'" v-loading="true">
                正在重新处理，请稍候...
            </div>
            <div v-else-if="reprocessStatus === 'done'">
                <template v-if="reprocessResult">
                    匹配成功：<strong>{{ reprocessResult }}</strong>
                </template>
                <template v-else>
                    该内容未匹配任何规则
                </template>
            </div>
            <div v-else-if="reprocessStatus === 'failed'">
                {{ reprocessResult }}
            </div>
        </div>
        <template #footer>
            <el-button @click="showReprocessDialog = false">取消</el-button>
            <el-button type="primary" @click="reprocess">确定</el-button>
        </template>
    </el-dialog>
    <div v-if="detail">
        <div style="display: flex; align-items: center; gap: 15px;margin-bottom: 20px;">
            <h2 style="margin: 0;">{{ getContentMark(detail.content) }}</h2>
            <el-tag v-if="detail.result_rule" :type="detail.is_whitelist ? 'success' : 'primary'"
                style="margin-right: 10px;">{{
                    detail.result_rule }}</el-tag>
            <el-tag v-else type="info" style="margin-right: 10px;">未匹配</el-tag>
        </div>
        <div style="margin-bottom: 20px;">
            <span style="color: gray;">处理时间：{{ formatDate(detail.process_time) }}</span>
        </div>
        <el-button @click="gotoPost(detail.content.tid, detail.content.pid)" type="primary">原贴</el-button>
        <el-button @click="openReprocessDialog" type="primary" :disabled="invalidDetail">重新处理</el-button>
        <div style="width: 100%">
            <el-tabs v-model="currRule" style="margin-top: 15px;">
                <el-tab-pane v-for="({ rule, conditions }, rule_index) in contexts" :key="rule_index"
                    :label="rule.name + (rule.result ? '✅' : '❌') + (hitRuleIndex === rule_index ? '*' : '')" :name="rule.name">
                    <el-timeline style="margin-top: 15px;" class="process-timeline">
                        <el-timeline-item v-for="condition in conditions" :key="condition.type + condition.key"
                            :hollow="rule.whitelist" :type="condition.style">
                            <el-card style="margin-right: 5px;">
                                <div class="header">
                                    <h3 style="margin: 0;">
                                        {{ condition.name }}
                                    </h3>
                                    <el-tag v-if="condition.key" class="tag" size="small">{{ condition.key }}</el-tag>
                                </div>
                                <div class="info-container">
                                    <div v-if="condition.context === UNPROCESSED_TEXT"
                                        style="color: gray; display: flex; align-items: center;">
                                        <i>未处理，无法提供信息</i>
                                        <el-tooltip content="为节省性能，匹配结果确定后不会处理后续条件" placement="top">
                                            <el-icon color="gray" style="margin-left: 10px;">
                                                <i-ep-question-filled />
                                            </el-icon>
                                        </el-tooltip>
                                    </div>
                                    <template v-else>
                                        <template v-for="(line, line_index) in condition.context.split('\n')"
                                            :key="line_index">{{ line }}<br></template>
                                    </template>
                                </div>
                            </el-card>
                        </el-timeline-item>
                    </el-timeline>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
    <div v-else-if="detail === null" class="center">
        正在加载
    </div>
    <div v-else class="center">
        加载失败
    </div>
</template>



<style scoped>
.center {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
}

.info-container {
    padding: 10px;
    background-color: #f0f0f0;
    border-radius: 4px;
    margin-top: 10px;
    word-break: break-all;
    margin-bottom: 5px;

}


.header {
    display: flex;
    align-items: center;
    gap: 10px;
}
</style>
<style>
.process-timeline .el-card__body {
    padding: 15px;
}
</style>
