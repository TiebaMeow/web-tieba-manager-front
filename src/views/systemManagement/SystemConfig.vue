<script setup lang="ts">
import { ref } from 'vue'
import TokenRequest from '@/lib/token'
import message from '@/lib/message'
import { onBeforeRouteLeave } from 'vue-router'

const edited = ref(false)
const confirmedEditServerConfig = ref(false)

onBeforeRouteLeave((to, from, next) => {
    if (edited.value) {
        message.confirm('设置未保存，确认离开？', '提示', () => {
            next()
        }, () => {
            next(false)
        })
    } else {
        next()
    }
})

interface SystemConfig {
    scan: {
        loop_cd: number
        query_cd: number
        thread_page_forward: number
        post_page_forward: number
        post_page_backward: number
        comment_page_forward: number
    },
    server: {
        host: string
        port: number
        key: string
        secret_key: string
        log_level: 'info' | 'warn' | 'error'
        access_log: boolean
        token_expire_days: number
        key_last_update: number
        encryption_method: 'plain' | 'md5'
        encryption_salt: string
    },
    database: {
        type: 'sqlite' | 'postgresql'
        path: string
        host: string
        port: number
        username: string
        password: string
        db: string
    }
}

function confirmEditServerConfig() {
    message.confirm('服务器设置更新后需要重启程序才能生效', '重要提示', () => {
        confirmedEditServerConfig.value = true
    }, () => {
        confirmedEditServerConfig.value = false
    })
}

const systemConfig = ref<RefResponse<SystemConfig>>(undefined)
TokenRequest.fetch(systemConfig, {
    url: '/api/system/get_config'
})

async function setSystemConfig() {
    if (!systemConfig.value) {
        message.notify('系统配置未加载，无法保存', message.error)
        return
    }
    // if (!edited.value) {
    //     message.notify('配置未修改，无需保存', message.info)
    //     return
    // }
    try {
        const response = await TokenRequest.post<BaseResponse<boolean>>({
            url: '/api/system/set_config',
            data: systemConfig.value
        })
        if (response.data.code === 200) {
            message.notify(response.data.message || '保存成功', message.success)
            edited.value = false
        } else {
            message.notify(response.data.message || `保存失败 ${response.data.code}`, message.error)
        }
    } catch (error) {
        message.notify(`保存系统配置失败 ${error}`, message.error)
        return
    }
}

</script>

<template>
    <div style="max-width: 1000px; flex-grow: 1;" v-if="systemConfig">
        <div style="max-width: 600px; margin-bottom: 200px;">
            <div>
                <h3>爬虫设置</h3>
                <el-form label-width="auto">
                    <el-form-item label="循环间隔">
                        <el-input-number v-model="systemConfig.scan.loop_cd" :min="0" @change="edited = true"
                            :controls="false">
                            <template #suffix>秒</template>
                        </el-input-number>
                    </el-form-item>
                    <el-form-item label="查询间隔">
                        <el-input-number v-model="systemConfig.scan.query_cd" :min="0" @change="edited = true"
                            :controls="false">
                            <template #suffix>秒</template>
                        </el-input-number>
                        <el-tooltip content="api调用间隔，当扫描出现429错误时，可以调大该值" placement="top">
                            <el-icon color="gray" style="margin-left: 10px;">
                                <i-ep-question-filled />
                            </el-icon>
                        </el-tooltip>
                    </el-form-item>
                </el-form>
            </div>
            <div>
                <h3>数据库设置</h3>
                <el-form label-width="auto">
                    <el-form-item label="数据库类型">
                        <el-select v-model="systemConfig.database.type" placeholder="请选择" @change="edited = true">
                            <el-option label="SQLite" value="sqlite"></el-option>
                            <el-option label="PostgreSQL" value="postgresql"></el-option>
                        </el-select>
                    </el-form-item>
                    <template v-if="systemConfig.database.type === 'sqlite'">
                        <el-form-item label="数据库文件路径">
                            <div style="display: flex; width: 100%; align-items: center;">
                                <el-input v-model="systemConfig.database.path" @change="edited = true"></el-input>
                                <el-tooltip content="相对于服务器的路径" placement="top">
                                    <el-icon color="gray" style="margin-left: 10px;">
                                        <i-ep-question-filled />
                                    </el-icon>
                                </el-tooltip>
                            </div>
                        </el-form-item>
                    </template>
                    <template v-else-if="systemConfig.database.type === 'postgresql'">
                        <el-form-item label="主机">
                            <el-input v-model="systemConfig.database.host" @change="edited = true"></el-input>
                        </el-form-item>
                        <el-form-item label="端口">
                            <el-input-number v-model="systemConfig.database.port" :min="1" :max="65535"
                                @change="edited = true" :controls="false"></el-input-number>
                        </el-form-item>
                        <el-form-item label="用户名">
                            <el-input v-model="systemConfig.database.username" @change="edited = true"></el-input>
                        </el-form-item>
                        <el-form-item label="密码">
                            <el-input v-model="systemConfig.database.password" show-password
                                @change="edited = true"></el-input>
                        </el-form-item>
                        <el-form-item label="数据库名">
                            <el-input v-model="systemConfig.database.db" @change="edited = true"></el-input>
                        </el-form-item>
                    </template>
                </el-form>
            </div>
            <div style="position: relative;">
                <h3>服务器设置</h3>
                <el-form label-width="auto" :class="{ 'disabled-cover': !confirmedEditServerConfig }">
                    <el-form-item label="主机">
                        <el-input v-model="systemConfig.server.host" @change="edited = true"></el-input>
                    </el-form-item>
                    <el-form-item label="端口">
                        <el-input-number v-model="systemConfig.server.port" :min="1" :max="65535"
                            @change="edited = true" :controls="false"></el-input-number>
                    </el-form-item>
                    <el-form-item label="密钥">
                        <el-input v-model="systemConfig.server.key" show-password @change="edited = true"></el-input>
                    </el-form-item>
                    <el-form-item label="登录有效期">
                        <el-input-number v-model="systemConfig.server.token_expire_days" :min="0"
                            @change="edited = true" :controls="false">
                            <template #suffix>天</template>
                        </el-input-number>
                    </el-form-item>
                </el-form>
                <el-button style="position: absolute; top: 45%; left: 45%;" type="warning"
                    @click="confirmEditServerConfig" v-if="!confirmedEditServerConfig">
                    编辑服务器设置
                </el-button>
            </div>
            <el-button style="margin-top: 20px; margin-bottom: 200px;" type="success"
                @click="setSystemConfig">保存</el-button>
        </div>
    </div>
    <div v-else-if="systemConfig === null" v-loading="true">
        Loading...
    </div>
    <div v-else>
        <h2>加载失败，请尝试刷新页面</h2>
    </div>
</template>


<style scoped>
.disabled-cover {
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
}
</style>
