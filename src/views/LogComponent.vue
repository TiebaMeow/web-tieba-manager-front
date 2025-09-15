<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue';
import TokenRequest from '@/lib/token';
import type { ScrollbarInstance } from 'element-plus';
import { useRoute } from 'vue-router';
import message from '@/lib/message';
import { getData } from '@/lib/utils';
import { SwitchTokenEvent } from '@/lib/data/tokenManager';

// TODO 切换日志文件时，在小屏幕设备上，会导致意外的内容增宽 (?)

const route = useRoute();

const system = computed(() => route.path.startsWith('/system-log'))
const apiUrl = computed(() => system.value ? '/api/system/log/' : '/api/log/')

interface LogData {
    message: string
    info: string
    name: string
    extra: {
        tid?: number
        pid?: number
        uid?: number
    }
}

const logList = ref<string[]>([]);

const currLogData = ref<LogData[] | false>([]);
const currLog = ref('')

const loadingList = ref(false)
const loadingLog = ref(false)

const innerRef = ref<HTMLElement | null>(null)
const scrollbarRef = ref<ScrollbarInstance | null>(null)

const logMode = ref<'history' | 'realtime'>('history')

const realtimeLogData = ref<LogData[] | false>([])

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
            currLogData.value = response.data.data
            scrollToBottom()
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
                const data = JSON.parse(event.data)
                if (realtimeLogData.value === false) {
                    realtimeLogData.value = []
                    return
                }
                realtimeLogData.value.push(data)
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
</script>

<template>
    <div style="flex-grow: 1;max-width: 1200px" v-loading="loadingList">
        <h2>日志</h2>
        <div style="display: flex; align-items: center;">
            <el-radio-group v-model="logMode" style="margin-right: 10px; flex-shrink: 0;">
                <el-radio-button label="历史" value="history" />
                <el-radio-button label="实时" value="realtime" />
            </el-radio-group>
            <el-select v-model="currLog" style="width: 233px" :disabled="logMode === 'realtime'">
                <el-option v-for="log in logList" :key="log" :label="log" :value="log" />
            </el-select>
        </div>
        <el-divider />
        <div class="log-container" v-loading="loadingLog">
            <el-scrollbar ref="scrollbarRef" v-if="hasValidLogData">
                <p v-if="logMode === 'history' && currLogData" style="margin: 10px 20px;" ref="innerRef">
                    <template v-for="(log, index) in currLogData" :key="index">
                        {{ log.message }}<br />
                    </template>
                </p>
                <p v-else-if="realtimeLogData !== false" style="margin: 10px 20px;" ref="innerRef">
                    <template v-for="(log, index) in realtimeLogData" :key="index">
                        {{ log.message }}<br />
                    </template>
                </p>
                <div style="margin-bottom: 100px;"></div>
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
    border-radius: 6px;
    border: 1px solid black;
    overflow: hidden;
    word-break: keep-all;
}
</style>
