<script setup lang="ts">
import { Document, User } from '@element-plus/icons-vue';
import { gotoPortrait, gotoPost } from '@/lib/utils';


type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
type TagType = 'info' | 'primary' | 'warning' | 'danger'

const {
    log,
    // isRealtime = false,
    isSystem = false
} = defineProps<{
    log: {
        time: string
        name: string
        level: LogLevel
        message: string
        seq?: number
        extra: {
            tid?: number
            pid?: number
            uid?: number
            portrait?: string
        }
    },
    // isRealtime: boolean
    isSystem: boolean
}>()


const LOG_LEVEL_TYPE: Record<LogLevel, TagType> = {
    DEBUG: 'info',
    INFO: 'primary',
    WARN: 'warning',
    ERROR: 'danger',
    CRITICAL: 'danger'
}

const multiLine = computed(() => {
    return log.message.includes('\n')
})
const collapseActive = ref('')
</script>

<template>
    <div class="log-card">
        <div class="log-card-header" :class="`level-${log.level.toLowerCase()}`">
            <el-tag type="info" effect="plain">
                <span>{{ log.time }}</span>
            </el-tag>
            <el-tag :type="LOG_LEVEL_TYPE[log.level]" effect="plain" style="width: 80px">
                {{ log.level }}
            </el-tag>
            <el-tag :type="log.name === 'system' ? 'primary' : 'success'" effect="plain" v-if="isSystem"
                style="min-width: 100px;">
                {{ log.name }}
            </el-tag>
            <div v-if="multiLine" class="log-text" style="min-width: 0;"
                :style="{ width: collapseActive ? '100%' : 'auto' }">
                <el-collapse v-model="collapseActive" accordion>
                    <el-collapse-item :title="`日志内容（共 ${log.message.split('\n').length} 行）`" name="1"
                        :style="{ width: '100%' }">
                        <div style="white-space: pre-wrap;">{{ log.message }}</div>
                    </el-collapse-item>
                </el-collapse>
            </div>
            <div v-else style="white-space: pre-wrap; word-break: break-all;" class="log-text">
                {{ log.message }}
            </div>
            <div style="display: flex;flex-grow: 1;">

            </div>
            <el-button-group>
                <el-button v-if="log.extra.portrait" :icon="User" @click="gotoPortrait(log.extra.portrait)" />
                <el-button v-if="log.extra.tid && log.extra.pid" :icon="Document"
                    @click="gotoPost(log.extra.tid, log.extra.pid)" />
            </el-button-group>
        </div>
    </div>
</template>

<style scoped>
.log-card {
    border: 1px solid #eee;
    border-radius: 6px;
    margin-bottom: 10px;
    padding: 10px;
    box-shadow: 0 2px 4px rgba(0, 0,
            0, 0.1);
    background-color: #fff;
}

.log-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.log-time {
    color: rebeccapurple;
    padding: 0 5px;
    border-radius: 4px;
    background-color: #fff;
}

.log-text {
    font-family: 'Sarasa Mono SC Nerd', 'Source Han Mono', 'Microsoft YaHei Mono', 'JetBrains Mono', '更纱黑体 Mono SC', monospace;
}
</style>
