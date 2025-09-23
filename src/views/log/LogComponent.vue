<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue';
import TokenRequest from '@/lib/token';
import type { ScrollbarInstance } from 'element-plus';
import { useRoute } from 'vue-router';
import message from '@/lib/message';
import { getData } from '@/lib/utils';
import { SwitchTokenEvent } from '@/lib/data/tokenManager';
import LogCard from './LogCard.vue';

// TODO 切换日志文件时，在小屏幕设备上，会导致意外的内容增宽 (?)


// 检测实时日志是否位于底部的管容量，以决定是否自动滚动到底部
const SCROLL_TOLERANCE = 50

const route = useRoute();

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'

const system = computed(() => route.path.startsWith('/system-log'))
const apiUrl = computed(() => system.value ? '/api/system/log/' : '/api/log/')
const selectedLevels = ref<LogLevel[]>(['INFO', 'WARN', 'ERROR'])

interface LogData {
    message: string
    level: LogLevel
    name: string
    extra: {
        tid?: number
        pid?: number
        uid?: number
        portrait?: string
    }
}


interface StructuredLog {
    time: string
    name: string
    level: LogLevel
    message: string,
    extra: LogData['extra']
    seq?: number
}

const LevelTag = {
    DEBUG: 'info',
    INFO: 'primary',
    WARN: 'warning',
    ERROR: 'danger',
    CRITICAL: 'danger',
}

const logList = ref<string[]>([]);

const currLogData = ref<StructuredLog[] | false>([]);
const currLog = ref('')

const loadingList = ref(false)
const loadingLog = ref(false)

const innerRef = ref<HTMLElement | null>(null)
const scrollbarRef = ref<ScrollbarInstance | null>(null)

const logMode = ref<'history' | 'realtime'>('realtime')
// TODO 优化history模式下的日志加载性能

const realtimeLogData = ref<StructuredLog[] | false>([])

function parseLogLine(line: LogData, seq?: number): StructuredLog | null {
    try {
        const parts = line.message.split('|', 3)
        if (parts.length < 3) {
            throw new Error('日志格式不正确')
        }
        const timeParts = parts[0].split(' ')
        if (timeParts.length < 3) {
            throw new Error('时间格式不正确')
        }
        const message = parts[2].trim()
        const time = timeParts[1]
        return {
            time,
            name: line.name,
            level: line.level,
            message,
            extra: line.extra,
            seq
        }
    } catch (e) {
        console.error('解析日志行失败', e)
        return null
    }
}

async function fetchLogList() {
    loadingList.value = true
    try {
        const response = await TokenRequest.get<BaseResponse<string[]>>({
            url: `/api/log/get_list`
        })
        if (response.data.code === 200) {
            logList.value = response.data.data
            if (!logList.value.includes(currLog.value)) {
                currLog.value = logList.value[0] || ''
            }
        } else {
            message.notify(response.data.message, message.error)
        }
    } catch {
        message.notify('获取日志列表失败', message.error)
    } finally {
        loadingList.value = false
    }
}
fetchLogList()

async function fetchLog(file: string) {
    loadingLog.value = true
    try {
        const response = await TokenRequest.get<BaseResponse<LogData[]>>({
            url: `${apiUrl.value}get`,
            data: {
                file
            }
        })
        if (response.data.code === 200) {
            currLogData.value = []
            response.data.data.forEach((line, index) => {
                const parsed = parseLogLine(line, index + 1)
                if (parsed && currLogData.value) {
                    currLogData.value.push(parsed)
                }
            })

            if (logMode.value === 'history') {
                scrollToBottom()
            }
        } else {
            message.notify(response.data.message, message.error)
            currLogData.value = false
        }
    } catch {
        message.notify('获取日志失败', message.error)
        currLogData.value = false
    } finally {
        loadingLog.value = false
    }
}
watch(currLog, (newLog) => {
    if (newLog) {
        fetchLog(newLog)
    } else {
        currLogData.value = []
    }
})
watch(logMode, (newMode) => {
    if (newMode === 'history') {
        fetchLogList()
    }
    scrollToBottom()
})

function scrollToBottom() {
    nextTick(() => {
        if (scrollbarRef.value && innerRef.value) {
            scrollbarRef.value.setScrollTop(innerRef.value.scrollHeight)
        }
    })
}


const RealtimeLog = new class RealtimeLog {
    shouldStop: boolean = false
    eventSource: EventSource | null = null
    listerner: (() => void) | null = null
    constructor() {
        this.listerner = SwitchTokenEvent.on((newToken) => {
            if (newToken) {
                this.closeOldConnection()
                this.start(newToken)
            } else {
                this.closeOldConnection()
                realtimeLogData.value = false
            }
        })

        watch(system, () => {
            realtimeLogData.value = false
            this.closeOldConnection()
            const token = getData<string>('access_token')
            if (token) {
                this.start(token)
            }
        })
    }

    closeOldConnection() {
        if (this.eventSource) {
            this.eventSource.close()
            this.eventSource = null
        }
    }

    start(token: string) {
        if (this.shouldStop) {
            // 组件已卸载，停止继续链接
            return
        }
        const url = `${TokenRequest.host}${apiUrl.value}realtime?token=${encodeURIComponent(token)}`
        const eventSource = new EventSource(url)
        realtimeLogData.value = []

        eventSource.onmessage = (event) => {
            try {
                if (event.data === '[DONE]') {
                    // 初始化完成标志
                    nextTick(() => {
                        if (logMode.value === 'realtime') {
                            scrollToBottom()
                        }
                    })
                    return
                }
                const data = JSON.parse(event.data) as LogData

                if (realtimeLogData.value === false) {
                    realtimeLogData.value = []
                    return
                }
                const parsed = parseLogLine(data)
                if (parsed) {
                    realtimeLogData.value.push(parsed)

                    if (scrollbarRef.value && innerRef.value && scrollbarRef.value.wrapRef) {
                        const { scrollTop, clientHeight } = scrollbarRef.value.wrapRef
                        // 极限值为 +110px
                        const isAtBottom = scrollTop + clientHeight >= innerRef.value.scrollHeight + 110 - SCROLL_TOLERANCE

                        // 如果当前在底部，则自动滚动到底部
                        if (logMode.value === 'realtime' && isAtBottom) {
                            scrollToBottom()
                        }
                    }
                }
            } catch {
                message.notify('解析日志数据失败', message.error)
            }
        }

        eventSource.onerror = () => {
            // 连接异常处理
            eventSource?.close()

            message.notify('实时日志连接已关闭', message.error)
            realtimeLogData.value = false

        }

        this.closeOldConnection()
        this.eventSource = eventSource
    }

    stop() {
        this.shouldStop = true
        this.closeOldConnection()
        if (this.listerner) {
            this.listerner()
            this.listerner = null
        }
    }
}

onMounted(() => {
    const token = getData<string>('access_token')
    if (!token) {
        message.notify('未找到访问令牌，请重新登录', message.error)
        realtimeLogData.value = false
        return
    }
    RealtimeLog.start(token)
})

onUnmounted(SwitchTokenEvent.on((token) => {
    if (token) {
        currLog.value = ''
        fetchLogList()
    }
}))
onUnmounted(() => {
    RealtimeLog.stop()
})
watch(system, () => {
    currLog.value = ''
    fetchLogList()
})

const hasValidLogData = computed(() => {
    return logMode.value === 'history' ? currLogData.value !== false : realtimeLogData.value !== false
})


const logSearch = ref('')

const filteredLogData = computed<StructuredLog[] | false>(() => {
    const levels = new Set(selectedLevels.value)
    let logs: StructuredLog[] | false
    if (logMode.value === 'history') {
        logs = currLogData.value === false ? false : currLogData.value.filter(log => levels.has(log.level))
    } else {
        logs = realtimeLogData.value === false ? false : realtimeLogData.value.filter(log => levels.has(log.level))
    }
    if (logs === false) {
        return false
    }
    if (!logSearch.value) {
        return logs
    }
    try {
        const regex = new RegExp(logSearch.value, 'i')
        return logs.filter(log => regex.test(log.message))
    } catch {
        return logs.filter(log => log.message.toLowerCase().includes(logSearch.value.toLowerCase()))
    }
})
</script>

<template>
    <div style="flex-grow: 1" v-loading="loadingList">
        <h2>{{ system ? "系统" : '' }}日志</h2>
        <div style="display: flex; align-items: center; flex-wrap: wrap;">
            <el-select v-model="selectedLevels" multiple placeholder="选择日志级别" style="width: 220px; margin-right: 10px;">
                <el-option v-for="(tag, level) in LevelTag" :key="level" :value="level">
                    <el-tag :type="tag" effect="plain">{{ level }}</el-tag>
                </el-option>
                <template #tag>
                    <el-tag size="small" :type="LevelTag[level]" effect="plain" v-for="level in selectedLevels"
                        :key="level">{{ level
                        }}</el-tag>
                </template>
            </el-select>
            <el-radio-group v-model="logMode" style="margin-right: 10px; flex-shrink: 0;">
                <el-radio-button label="实时" value="realtime" />
                <el-radio-button label="历史" value="history" />
            </el-radio-group>
            <el-select v-model="currLog" style="width: 233px; margin-right: 10px;" :disabled="logMode === 'realtime'">
                <el-option v-for="log in logList" :key="log" :label="log" :value="log" />
            </el-select>
            <el-input v-model="logSearch" placeholder="搜索 | Regex" style="width: 400px;">
            </el-input>
        </div>
        <el-divider style="margin-bottom: 0;" />
        <div class="log-container" v-loading="loadingLog">
            <el-scrollbar ref="scrollbarRef" v-if="hasValidLogData">
                <template v-if="filteredLogData && filteredLogData.length > 0">
                    <div ref="innerRef" style="margin: 10px;">
                        <LogCard v-for="(log, index) in filteredLogData" :key="index" :log="log" :isSystem="system" />
                    </div>
                    <div style="margin-bottom: 100px;"></div>
                </template>
                <div class="center" v-else-if="loadingLog || loadingList" style="margin-top: 100px;">
                    <h2>加载中...</h2>
                </div>
                <div class="center" v-else style="margin-top: 100px;">
                    <h2>当前筛选无日志</h2>
                </div>
            </el-scrollbar>
            <div v-else class="center" style="margin-top: 100px;">
                <h2>日志加载失败</h2>
            </div>
        </div>
    </div>
</template>

<style scoped>
.log-container {
    width: 100%;
    height: calc(100vh - 250px);
    overflow: hidden;
    word-break: keep-all;
}
</style>
