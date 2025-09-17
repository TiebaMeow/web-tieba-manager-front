<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import TokenRequest from '@/lib/token'
import message from '@/lib/message'
import { onBeforeRouteLeave } from 'vue-router'

const edited = ref(false)
const confirmedEditServerConfig = ref(false)

const formRef = ref<FormInstance>()
const formRules = reactive<FormRules>({
    'scan.loop_cd': [
        { required: true, message: '请输入循环间隔', trigger: 'blur' },
        { type: 'number', min: 0, message: '循环间隔必须大于等于0', trigger: 'blur' }
    ],
    'scan.query_cd': [
        { required: true, message: '请输入查询间隔', trigger: 'blur' },
        { type: 'number', min: 0, message: '查询间隔必须大于等于0', trigger: 'blur' }
    ],
    'database.path': [
        { required: true, message: '请输入数据库文件路径', trigger: 'blur' },
        { pattern: /^[^<>:"|?*]+$/, message: '路径不能包含非法字符', trigger: 'blur' }
    ],
    'database.host': [
        { required: true, message: '请输入主机地址', trigger: 'blur' },
        { pattern: /^(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})$/, message: '请输入合法的IP地址或域名', trigger: 'blur' }
    ],
    'database.port': [
        { required: true, message: '请输入端口', trigger: 'blur' },
        { type: 'number', message: '端口必须是数字', trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                if (value >= 1 && value <= 65535) {
                    callback()
                } else {
                    callback(new Error('端口范围应在 1-65535 之间'))
                }
            },
            trigger: 'blur'
        }
    ],
    'database.username': [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 1, max: 63, message: '长度应为 1 到 63 个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' }
    ],
    'database.password': [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 1, max: 100, message: '长度应为 1 到 100 个字符', trigger: 'blur' }
    ],
    'database.db': [
        { required: true, message: '请输入数据库名', trigger: 'blur' },
        { min: 1, max: 63, message: '长度应为 1 到 63 个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' }
    ],
    'server.host': [
        { required: true, message: '请输入主机地址', trigger: 'blur' },
        { pattern: /^(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})$/, message: '请输入合法的IP地址或域名', trigger: 'blur' }
    ],
    'server.port': [
        { required: true, message: '请输入端口', trigger: 'blur' },
        { type: 'number', message: '端口必须是数字', trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                if (value >= 1 && value <= 65535) {
                    callback()
                } else {
                    callback(new Error('端口范围应在 1-65535 之间'))
                }
            },
            trigger: 'blur'
        }
    ],
    'server.key': [
        { required: true, message: '请输入密钥', trigger: 'blur' },
        { min: 1, max: 32, message: '长度应为 1 到 32 个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]+$/, message: '只能包含英文字符、数字和常见符号', trigger: 'blur' }
    ],
    'server.token_expire_days': [
        { required: true, message: '请输入登录有效期', trigger: 'blur' },
        { type: 'number', min: 0, message: '有效期必须为非负整数', trigger: 'blur' }
    ]
})

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
    if (!systemConfig.value || !formRef.value) {
        message.notify('系统配置未加载，无法保存', message.error)
        return
    }
    try {
        await formRef.value.validate()
    } catch {
        message.notify('请检查表单是否填写正确', message.error)
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

const databaseTestStatus = ref<'idle' | 'testing' | 'success' | 'error'>('idle')
const databaseErrorMessage = ref('')

async function testDatabaseConnection() {
    if (!systemConfig.value) {
        message.notify('系统配置未加载，无法测试', message.error)
        return
    }
    try {
        databaseTestStatus.value = 'testing'
        databaseErrorMessage.value = ''
        const response = await TokenRequest.post<BaseResponse<boolean>>({
            url: '/api/system/test_db_connection',
            data: systemConfig.value.database
        })
        if (response.data.code === 200) {
            databaseTestStatus.value = 'success'
        } else {
            databaseTestStatus.value = 'error'
            databaseErrorMessage.value = response.data.message || `连接失败 ${response.data.code}`
        }
    } catch (error) {
        databaseTestStatus.value = 'error'
        databaseErrorMessage.value = `测试数据库连接失败 ${error}`
        return
    }
}

const usernameHasUppercase = computed(() => {
    const config = systemConfig.value as SystemConfig | undefined
    return config?.database && /[A-Z]/.test(config.database.username || '')
})
const dbnameHasUppercase = computed(() => {
    const config = systemConfig.value as SystemConfig | undefined
    return config?.database && /[A-Z]/.test(config.database.db || '')
})

</script>

<template>
    <div style="max-width: 1000px; flex-grow: 1;" v-if="systemConfig">
        <el-form ref="formRef" :model="systemConfig" :rules="formRules">
            <div style="max-width: 600px; margin-bottom: 200px;">
                <div>
                    <h3>爬虫设置</h3>
                    <el-form-item label="循环间隔" prop="scan.loop_cd">
                        <el-input-number v-model="systemConfig.scan.loop_cd" :min="0" @change="edited = true"
                            :controls="false">
                            <template #suffix>秒</template>
                        </el-input-number>
                    </el-form-item>
                    <el-form-item label="查询间隔" prop="scan.query_cd">
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
                </div>
                <div>
                    <h3>数据库设置</h3>
                    <el-form-item label="数据库类型" prop="database.type">
                        <el-select v-model="systemConfig.database.type" placeholder="请选择"
                            @change="edited = true; databaseTestStatus = 'idle'">
                            <el-option label="SQLite" value="sqlite"></el-option>
                            <el-option label="PostgreSQL" value="postgresql"></el-option>
                        </el-select>
                    </el-form-item>
                    <template v-if="systemConfig.database.type === 'sqlite'">
                        <el-form-item label="数据库文件路径" prop="database.path">
                            <div style="display: flex; width: 100%; align-items: center;">
                                <el-input v-model="systemConfig.database.path" @change="edited = true;"></el-input>
                                <el-tooltip content="相对于服务器的路径" placement="top">
                                    <el-icon color="gray" style="margin-left: 10px;">
                                        <i-ep-question-filled />
                                    </el-icon>
                                </el-tooltip>
                            </div>
                        </el-form-item>
                    </template>
                    <template v-else-if="systemConfig.database.type === 'postgresql'">
                        <el-form-item label="主机" prop="database.host">
                            <el-input v-model="systemConfig.database.host" @change="edited = true"></el-input>
                        </el-form-item>
                        <el-form-item label="端口" prop="database.port">
                            <el-input-number v-model="systemConfig.database.port" :min="1" :max="65535"
                                @change="edited = true" :controls="false"></el-input-number>
                        </el-form-item>
                        <el-form-item label="用户名" prop="database.username">
                            <el-input v-model="systemConfig.database.username" @change="edited = true"></el-input>
                        </el-form-item>
                        <el-alert v-if="databaseTestStatus === 'error' && usernameHasUppercase" type="warning" show-icon
                            :closable="false" style="margin-bottom: 15px;">
                            检测到用户名包含大写字母，PostgreSQL 未加引号时会自动转为小写，可能导致连接失败。建议只用小写字母。
                        </el-alert>
                        <el-form-item label="密码" prop="database.password">
                            <el-input v-model="systemConfig.database.password" show-password
                                @change="edited = true"></el-input>
                        </el-form-item>
                        <el-form-item label="数据库名" prop="database.db">
                            <el-input v-model="systemConfig.database.db" @change="edited = true"></el-input>
                        </el-form-item>
                        <el-alert v-if="databaseTestStatus === 'error' && dbnameHasUppercase" type="warning" show-icon
                            :closable="false" style="margin-bottom: 15px;">
                            检测到数据库名包含大写字母，PostgreSQL 未加引号时会自动转为小写，可能导致连接失败。建议只用小写字母。
                        </el-alert>
                    </template>
                    <div v-if="databaseTestStatus !== 'idle'">
                        <el-alert v-if="databaseTestStatus === 'testing'" title="正在测试数据库连接..." type="info"
                            show-icon></el-alert>
                        <el-alert v-else-if="databaseTestStatus === 'success'" title="数据库连接成功" type="success"
                            show-icon></el-alert>
                        <el-alert v-else-if="databaseTestStatus === 'error'" :title="databaseErrorMessage" type="error"
                            show-icon>
                        </el-alert>
                    </div>
                    <el-button style="margin-top: 10px;" type="primary"
                        @click="testDatabaseConnection">测试数据库连接</el-button>
                </div>
                <div style="position: relative;">
                    <h3>服务器设置</h3>
                    <div :class="{ 'disabled-cover': !confirmedEditServerConfig }">
                        <el-form-item label="主机" prop="server.host">
                            <el-input v-model="systemConfig.server.host" @change="edited = true"></el-input>
                        </el-form-item>
                        <el-form-item label="端口" prop="server.port">
                            <el-input-number v-model="systemConfig.server.port" :min="1" :max="65535"
                                @change="edited = true" :controls="false"></el-input-number>
                        </el-form-item>
                        <el-form-item label="密钥" prop="server.key">
                            <el-input v-model="systemConfig.server.key" show-password
                                @change="edited = true"></el-input>
                        </el-form-item>
                        <el-form-item label="登录有效期" prop="server.token_expire_days">
                            <el-input-number v-model="systemConfig.server.token_expire_days" :min="0"
                                @change="edited = true" :controls="false">
                                <template #suffix>天</template>
                            </el-input-number>
                        </el-form-item>
                    </div>
                    <el-button style="position: absolute; top: 45%; left: 45%;" type="warning"
                        @click="confirmEditServerConfig" v-if="!confirmedEditServerConfig">
                        编辑服务器设置
                    </el-button>
                </div>
                <el-button style="margin-top: 20px; margin-bottom: 200px;" type="success"
                    @click="setSystemConfig">保存</el-button>
            </div>
        </el-form>
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
