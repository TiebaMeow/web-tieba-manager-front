<script setup lang="ts">
import { ref, reactive, type Ref } from 'vue';
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
const initializeInfo = ref<{ need_user: boolean, need_system: boolean } | null>(null)
const loading = ref(false)
const manualHost = ref(location.origin)
const manual = ref(false)

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
                router.push('/login')
                return
            }
        }, 1000)
    }
}

async function fetchInitializeInfo() {
    try {
        loading.value = true
        const resp = await request.get<BaseResponse<{
            need_user: boolean,
            need_system: boolean
        }>>({
            url: '/api/initialize/get_info',
        })
        initializeInfo.value = resp.data.data
        if (initializeInfo.value.need_user) {
            currForm.value = 'user'
        } else if (initializeInfo.value.need_system) {
            currForm.value = 'system'
        } else {
            Jump.jump()
        }
        manual.value = false
        return true
    } catch (err) {
        if (err instanceof AxiosError && err.response) {
            message.notify(`请求失败 ${err.response.status} ${err.message}`, message.error)
        } else {
            message.notify(`请求失败，发生错误 ${err}`, message.error)
        }
        manual.value = true
    } finally {
        loading.value = false
    }
}
fetchInitializeInfo()

const isSuccess = ref(false)
const currForm = ref<'user' | 'system' | false | null>(null)

const userFormRef = ref<FormInstance>()
const systemFormRef = ref<FormInstance>()

const userForm = ref({
    username: '',
    password: '',
    confirmPassword: ''
})

const systemForm = ref({
    host: 'localhost',
    port: location.port ? parseInt(location.port) : 36799,
    key: '',
    token_expire_days: 7,
    confirmKey: ''
})

const validateUserConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (userForm.value.password && !value) {
        return callback(new Error('请再次输入密码'))
    }
    if (value !== userForm.value.password) {
        return callback(new Error('两次输入的密码不一致'))
    }
    callback()
}

const validateSystemConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (systemForm.value.key && !value) {
        return callback(new Error('请再次输入密钥'))
    }
    if (value !== systemForm.value.key) {
        return callback(new Error('两次输入的密钥不一致'))
    }
    callback()
}

const userRules = reactive<FormRules>({
    username: FORM_RULES.username,
    password: FORM_RULES.password,
    confirmPassword: [
        { validator: validateUserConfirmPassword, trigger: 'blur' }
    ]
})

const systemRules = reactive<FormRules>({
    host: FORM_RULES.hostname,
    port: FORM_RULES.port,
    key: FORM_RULES.key,
    confirmKey: [
        { validator: validateSystemConfirmPassword, trigger: 'blur' }
    ]
})

async function nextStep() {
    if (currForm.value === 'user') {
        if (!userFormRef.value) return
        await userFormRef.value.validate((valid) => {
            if (valid) {
                if (initializeInfo.value?.need_system) {
                    currForm.value = 'system'
                } else {
                    submit()
                }
            } else {
                message.notify('请检查表单是否填写正确', message.error)
            }
        })
    } else {
        if (!systemFormRef.value) return
        await systemFormRef.value.validate((valid) => {
            if (valid) {
                submit()
            } else {
                message.notify('请检查表单是否填写正确', message.error)
            }
        })
    }
}

async function submit() {
    try {
        loading.value = true
        await request.post({
            url: '/api/initialize/initialize',
            data: {
                user: userForm.value,
                system: systemForm.value
            }
        })
        currForm.value = null
        isSuccess.value = true
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
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="center">
        <el-card class="login-card">
            <template #header>
                <span>初始化{{ currForm == 'user' ? '用户' : '系统' }}配置</span>
            </template>
            <div v-if="manual">
                <el-alert title="无法自动获取服务地址，请手动填写" type="warning" show-icon :closable="false" />
                <el-input v-model="manualHost" placeholder="服务地址" clearable style="margin-top: 10px;" />
                <el-button type="primary" style="margin-top: 10px;" @click="setManualHost">确认</el-button>
            </div>
            <div v-else-if="!currForm"
                style="height: 200px; display: flex; justify-content: center; align-items: center">
                <div v-if="isSuccess" style="text-align: center;">
                    <h2>初始化成功</h2>
                    {{ Jump.count }}秒后将转跳至登录页面
                </div>
                <h2 v-else-if="currForm === false">数据加载失败 </h2>
                <h2 v-else-if="initializeInfo === null" v-loading="true">正在加载...</h2>
                <div v-else style="text-align: center;">
                    <h2>系统已初始化</h2>
                    {{ Jump.count }}秒后将转跳至登录页面
                </div>
            </div>
            <template v-else>

                <el-form v-if="currForm == 'user'" :model="userForm" :rules="userRules" ref="userFormRef"
                    label-position="right" label-width="auto">
                    <el-form-item label="用户名" prop="username">
                        <el-input v-model="userForm.username" placeholder="请填写用户名" clearable />
                    </el-form-item>
                    <el-form-item label="密码" prop="password">
                        <el-input v-model="userForm.password" placeholder="请填写密码" show-password clearable />
                    </el-form-item>
                    <el-form-item label=" " prop="confirmPassword">
                        <el-input v-model="userForm.confirmPassword" placeholder="二次确认密码" show-password clearable />
                    </el-form-item>
                </el-form>
                <el-form v-else :model="systemForm" :rules="systemRules" ref="systemFormRef" label-position="right"
                    label-width="auto">
                    <el-form-item label="主机" prop="host">
                        <el-input v-model="systemForm.host" placeholder="请填写主机" clearable />
                    </el-form-item>
                    <el-form-item label="端口" prop="port">
                        <number-input v-model="systemForm.port" placeholder="36799" clearable />
                    </el-form-item>
                    <el-form-item label="密钥" prop="key">
                        <el-input v-model="systemForm.key" placeholder="请填写密钥" show-password clearable />
                    </el-form-item>
                    <el-form-item label=" " prop="confirmKey">
                        <el-input v-model="systemForm.confirmKey" placeholder="二次确认密钥" show-password clearable />
                        <el-alert title="系统密钥将用于高级配置，登录时选填" :closable="false" show-icon style="margin-top: 13px;" />
                    </el-form-item>
                    <el-form-item label="登录有效期">
                        <el-radio-group v-model="systemForm.token_expire_days">
                            <el-radio-button :value="1">1天</el-radio-button>
                            <el-radio-button :value="7">7天</el-radio-button>
                            <el-radio-button :value="30">30天</el-radio-button>
                            <el-radio-button :value="365">365天</el-radio-button>
                        </el-radio-group>
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
