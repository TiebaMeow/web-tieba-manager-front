<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import TokenRequest from '@/lib/token';
import message from '@/lib/message';
import { getData } from '@/lib/utils';
import { AxiosError } from 'axios';
import FORM_RULES from '@/lib/data/forumRules';

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const query = route.query

const loginForm = ref<{
    host: string,
    username: string,
    password: string,
    confirmPassword?: string,
    key?: string,
    code?: string
}>({
    host: query.host as string || getData<string>('server_host') || location.origin,
    username: query.username as string || '',
    password: '',
    key: '',
    code: query.code as string || ''
})

const validateConfirmPassword = (rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (mode.value === 'register') {
        if (!value) {
            return callback(new Error('请再次输入密码'))
        }
        if (value !== loginForm.value.password) {
            return callback(new Error('两次输入的密码不一致'))
        }
    }
    callback()
}

const rules = reactive<FormRules>({
    host: FORM_RULES.host,
    username: FORM_RULES.username,
    password: FORM_RULES.password,
    confirmPassword: [
        { validator: validateConfirmPassword, trigger: 'blur' }
    ],
    key: FORM_RULES.loginKey,
    code: FORM_RULES.code
})

const mode = computed(() => {
    if (route.name === 'register') {
        return 'register'
    }
    return 'login'
})

async function register() {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                const response = await TokenRequest.post<BaseResponse<boolean>>({
                    url: '/api/register',
                    data: {
                        username: loginForm.value.username,
                        password: loginForm.value.password,
                        code: loginForm.value.code
                    }
                })
                if (response.data.code === 200) {
                    message.notify(response.data.message || '注册成功', message.success)
                    router.push({ name: 'login', query: { host: loginForm.value.host, username: loginForm.value.username, password: loginForm.value.password, key: loginForm.value.key } })
                } else {
                    message.notify(response.data.message || '注册失败，请重试。', message.error)
                }
            } catch (error) {
                if (error instanceof AxiosError) {
                    switch (error.response?.status) {
                        case 400:
                            message.notify(error.response.data.detail || '注册失败，请重试。', message.error)
                            break;
                        case 404:
                            message.notify('服务地址不存在，请检查服务地址。', message.error)
                            break
                        case 500:
                            message.notify('内部错误，请稍后再试。', message.error)
                            break;
                        default:
                            message.notify('未知错误，请稍后再试。' + error, message.error)
                            break;
                    }
                } else {
                    message.notify('未知错误，请稍后再试。' + error, message.error)

                }
            }
        } else {
            message.notify('请检查表单是否填写正确', message.error)
        }
    })
}

async function login() {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
        if (valid) {
            TokenRequest.switchHost(loginForm.value.host)
            try {
                await TokenRequest.login('/api/login', loginForm.value.username, loginForm.value.password, loginForm.value.key)
                message.notify('登录成功。', message.success)
                router.push('/home')
            } catch (error) {
                if (error instanceof AxiosError) {
                    switch (error.response?.status) {
                        case 401:
                            message.notify(error.response.data.detail, message.error)
                            break;
                        case 404:
                            message.notify('服务地址不存在，请检查服务地址。', message.error)
                            break
                        case 500:
                            message.notify('内部错误，请稍后再试。', message.error)
                            break;
                        default:
                            message.notify('未知错误，请稍后再试。' + error, message.error)
                            break;
                    }
                } else {
                    message.notify('未知错误，请稍后再试。' + error, message.error)

                }
            }
        } else {
            message.notify('请检查表单是否填写正确', message.error)
        }
    })
}

</script>

<template>
    <div class="center">
        <el-card class="login-card">
            <template #header>
                <span>连接到WTM服务</span>
            </template>
            <el-form :model="loginForm" :rules="rules" ref="formRef" label-width="auto">
                <el-form-item label="服务地址" prop="host">
                    <el-input v-model="loginForm.host" placeholder="请填写服务地址" clearable />
                </el-form-item>
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="loginForm.username" placeholder="用户名" clearable />
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input v-model="loginForm.password" placeholder="用户密码" clearable show-password />
                </el-form-item>
                <el-form-item label="确认密码" v-if="mode === 'register'" prop="confirmPassword">
                    <el-input v-model="loginForm.confirmPassword" placeholder="请再输入一次密码" clearable show-password />
                </el-form-item>
                <el-form-item label="系统密钥" v-if="mode === 'login'" prop="key">
                    <el-input v-model="loginForm.key" placeholder="系统密钥（选填）" clearable show-password />
                </el-form-item>
                <el-form-item label="邀请码" v-if="mode === 'register'" prop="code">
                    <el-input v-model="loginForm.code" placeholder="邀请码" clearable />
                </el-form-item>
                <template v-if="mode === 'login'">
                    <el-button @click="router.push('register')">注册</el-button>
                    <el-button type="success" @click="login">开始连接</el-button>
                </template>
                <template v-else>
                    <el-button @click="router.push('login')">返回登录</el-button>
                    <el-button type="success" @click="register">注册</el-button>
                </template>
            </el-form>
        </el-card>
    </div>
</template>


<style scoped>
.login-card {
    width: min(500px, 0.9*100vw);
    margin-top: 100px;
}
</style>
