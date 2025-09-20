<script setup lang="ts">
import { ref, reactive, type Ref, onMounted } from 'vue';
import NumberInput from '@/components/NumberInput.vue';
import message from '@/lib/message';
import Requests from '@/lib/request';
import { useRouter } from 'vue-router';
import FORM_RULES from '@/lib/data/forumRules';
import type { FormInstance, FormRules } from 'element-plus';
import { AxiosError } from 'axios';

const router = useRouter()
const request = new Requests({
    host: location.origin
})

// loading: 正在加载, form: 显示表单, success: 初始化成功, fail: 获取初始化信息失败, initialized: 已初始化
const status = ref<'loading' | 'form' | 'success' | 'fail' | 'initialized'>('loading')
const initializeInfo = ref<{ need_user: boolean, need_system: boolean } | null>(null)
const manualHost = ref(location.origin)

const currForm = ref<'user' | 'system'>('user')

async function setManualHost() {
    request.host = manualHost.value
    const resp = await fetchInitializeInfo()
    if (resp) {
        message.notify('初始化信息获取成功', message.success)
    }
}

const Jump = new class {
    count: Ref<number>
    constructor() {
        this.count = ref(5)
    }
    jump() {
        const interval = setInterval(() => {
            this.count.value -= 1
            if (this.count.value <= 0) {
                this.count.value = 1 // 优化体验，防止变成0后页面空白
                clearInterval(interval)
                const params: {
                    host?: string
                    username?: string
                } = {}

                const isManual = new URL(request.host).origin !== location.origin

                // 如果手动填写了host
                const { protocol, hostname } = new URL(request.host)

                // 如果是手动填写host，且系统已经初始化
                let port: string;
                if (isManual && status.value === 'initialized') {
                    port = (new URL(manualHost.value)).port;
                } else {
                    port = unifiedForm.value.system.port.toString();
                }

                // 混合一下
                const newHost = `${protocol}//${hostname}${port ? `:${port}` : ''}`
                // 如果和当前地址不一样，传递host参数
                if (newHost !== location.origin) {
                    params.host = newHost
                }
                // 如果设置了用户名，传递用户名参数
                if (unifiedForm.value.user.username) {
                    params.username = unifiedForm.value.user.username
                }

                const locationPort = location.port ? location.port : (location.protocol === 'http:' ? '80' : '443')
                if (!isManual && locationPort !== unifiedForm.value.system.port.toString()) {
                    // 当被初始化的程序提供webui，且端口不同，强制跳转
                    // 假定当前的hostname和protocol在初始化后能够访问webui资源
                    delete params.host // 删除host，防止重复传递
                    location.href = `${newHost}/#/login${Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''}`
                } else {
                    router.push({ name: 'login', query: params })
                }
            }
        }, 1000)
    }
}

async function fetchInitializeInfo() {
    try {
        status.value = 'loading'
        const resp = await request.get<BaseResponse<{
            need_user: boolean,
            need_system: boolean
        }>>({
            url: '/api/initialize/get_info',
        })
        initializeInfo.value = resp.data.data
        if (initializeInfo.value.need_user) {
            currForm.value = 'user'
            status.value = 'form'
        } else if (initializeInfo.value.need_system) {
            currForm.value = 'system'
            status.value = 'form'
        } else {
            status.value = 'initialized'
            Jump.jump()
        }
        return true
    } catch (err) {
        if (err instanceof AxiosError && err.response) {
            message.notify(`请求失败 ${err.response.status} ${err.message}`, message.error)
        } else {
            message.notify(`请求失败，发生错误 ${err}`, message.error)
        }
        status.value = 'fail'
    }
}
onMounted(fetchInitializeInfo)

const formRef = ref<FormInstance>()

const unifiedForm = ref({
    user: {
        username: '',
        password: '',
        confirmPassword: ''
    },
    system: {
        host: 'localhost',
        port: location.port ? parseInt(location.port) : 36799,
        key: '',
        token_expire_days: 7,
        confirmKey: ''
    },
    secureKey: ''
})

const validateUserConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (unifiedForm.value.user.password && !value) {
        return callback(new Error('请再次输入密码'))
    }
    if (value !== unifiedForm.value.user.password) {
        return callback(new Error('两次输入的密码不一致'))
    }
    callback()
}

const validateSystemConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (unifiedForm.value.system.key && !value) {
        return callback(new Error('请再次输入系统密钥'))
    }
    if (value !== unifiedForm.value.system.key) {
        return callback(new Error('两次输入的系统密钥不一致'))
    }
    callback()
}

const rules = reactive<FormRules>({
    'user.username': FORM_RULES.username,
    'user.password': FORM_RULES.password,
    'user.confirmPassword': [
        { validator: validateUserConfirmPassword, trigger: 'blur' }
    ],
    'system.host': FORM_RULES.hostname,
    'system.port': FORM_RULES.port,
    'system.key': FORM_RULES.key,
    'system.confirmKey': [
        { validator: validateSystemConfirmPassword, trigger: 'blur' }
    ],
    secureKey: { required: true, message: '请输入初始化密钥', trigger: 'blur' }
})

async function nextStep() {
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
        if (valid) {
            if (currForm.value === 'user' && initializeInfo.value?.need_system) {
                currForm.value = 'system'
            } else {
                submit()
            }
        } else {
            message.notify('请检查表单是否填写正确', message.error)
        }
    })
}

async function submit() {
    try {
        status.value = 'loading'
        await request.post({
            url: '/api/initialize/initialize',
            data: {
                user: unifiedForm.value.user,
                system: unifiedForm.value.system,
                secure_key: unifiedForm.value.secureKey
            }
        })
        status.value = 'success'
        Jump.jump()
    } catch (err) {
        if (err instanceof AxiosError && err.response) {
            if (err.response.status == 422) {
                message.notify('表单存在错误，请检查', message.error)
            } else if (err.response.status == 400) {
                if (err.response.data.detail) {
                    message.notify(err.response.data.detail, message.error)
                } else {
                    message.notify('初始化失败，请重试', message.error)
                }
            } else {
                message.notify(`初始化失败 ${err.response.status} ${err.message}`, message.error)
            }
        } else {
            message.notify(`未知错误 ${err}`, message.error)
        }
        status.value = 'form' // 提交失败返回表单
    }
}
</script>

<template>
    <div class="center">
        <el-card class="login-card">
            <template #header>
                <span v-if="status === 'form'">初始化{{ currForm == 'user' ? '用户' : '系统' }}配置</span>
                <span v-else>初始化</span>
            </template>
            <div v-if="status === 'fail'">
                <el-alert title="无法自动获取服务地址，请手动填写" type="warning" show-icon :closable="false" />
                <el-input v-model="manualHost" placeholder="服务地址" clearable style="margin-top: 10px;" />
                <el-button type="primary" style="margin-top: 10px;" @click="setManualHost">确认</el-button>
            </div>
            <div v-else-if="status === 'loading'"
                style="height: 200px; display: flex; justify-content: center; align-items: center">
                <h2 v-loading="true">正在加载...</h2>
            </div>
            <div v-else-if="status === 'success'"
                style="height: 200px; display: flex; justify-content: center; align-items: center; text-align: center;">
                <div>
                    <h2>初始化成功</h2>
                    {{ Jump.count }}秒后将转跳至登录页面
                </div>
            </div>
            <div v-else-if="status === 'initialized'"
                style="height: 200px; display: flex; justify-content: center; align-items: center; text-align: center;">
                <div>
                    <h2>系统已初始化</h2>
                    {{ Jump.count }}秒后将转跳至登录页面
                </div>
            </div>
            <template v-else-if="status === 'form'">
                <el-form v-if="currForm == 'user'" :model="unifiedForm" :rules="rules" ref="formRef"
                    label-position="right" label-width="auto">
                    <el-form-item label="用户名" prop="user.username">
                        <el-input v-model="unifiedForm.user.username" placeholder="请填写用户名" clearable />
                    </el-form-item>
                    <el-form-item label="密码" prop="user.password">
                        <el-input v-model="unifiedForm.user.password" placeholder="请填写密码" show-password clearable />
                    </el-form-item>
                    <el-form-item label=" " prop="user.confirmPassword">
                        <el-input v-model="unifiedForm.user.confirmPassword" placeholder="二次确认密码" show-password
                            clearable />
                    </el-form-item>
                    <el-form-item label="初始化密钥" prop="secureKey">
                        <el-input v-model="unifiedForm.secureKey" placeholder="请填写初始化密钥" show-password clearable />
                    </el-form-item>
                </el-form>
                <el-form v-else :model="unifiedForm" :rules="rules" ref="formRef" label-position="right"
                    label-width="auto">
                    <el-form-item label="主机" prop="system.host">
                        <el-input v-model="unifiedForm.system.host" placeholder="请填写主机" clearable />
                    </el-form-item>
                    <el-form-item label="端口" prop="system.port">
                        <number-input v-model="unifiedForm.system.port" placeholder="36799" clearable />
                    </el-form-item>
                    <el-form-item label="系统密钥" prop="system.key">
                        <el-input v-model="unifiedForm.system.key" placeholder="请填写系统密钥" show-password clearable />
                    </el-form-item>
                    <el-form-item label=" " prop="system.confirmKey">
                        <el-input v-model="unifiedForm.system.confirmKey" placeholder="二次确认系统密钥" show-password
                            clearable />
                        <el-alert title="系统密钥将用于高级配置，登录时选填" :closable="false" show-icon style="margin-top: 13px;" />
                    </el-form-item>
                    <el-form-item label="登录有效期">
                        <el-radio-group v-model="unifiedForm.system.token_expire_days">
                            <el-radio-button :value="1">1天</el-radio-button>
                            <el-radio-button :value="7">7天</el-radio-button>
                            <el-radio-button :value="30">30天</el-radio-button>
                            <el-radio-button :value="365">365天</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="初始化密钥" prop="secureKey">
                        <el-input v-model="unifiedForm.secureKey" placeholder="请填写初始化密钥" show-password clearable />
                    </el-form-item>
                </el-form>
                <div style="margin-top: 20px;">
                    <el-button type="primary" v-if="currForm == 'system' && initializeInfo?.need_user"
                        @click="currForm = 'user'">上一步</el-button>
                    <el-button type="success" v-if="currForm == 'system' || !initializeInfo?.need_system"
                        @click="nextStep">提交</el-button>
                    <el-button type="primary" v-else @click="nextStep">下一步</el-button>
                </div>
            </template>
        </el-card>
    </div>
</template>

<style scoped>
.login-card {
    width: min(500px, 0.9*100vw);
    margin-top: 100px;
}
</style>
