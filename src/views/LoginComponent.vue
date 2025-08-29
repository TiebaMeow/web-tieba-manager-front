<script setup lang="ts">
import { ref } from 'vue';
import TokenRequest from '@/lib/token';
import message from '@/lib/message';
import { getData } from '@/lib/utils';
import { AxiosError } from 'axios';
import router from '@/router'

const query = router.currentRoute.value.query
const loginForm = ref<{
    host: string,
    username: string,
    password: string
    key?: string
}>({
    host: query.host as string || getData<string>('server_host') || location.origin,
    username: query.username as string || '',
    password: query.password as string || '',
    key: query.key as string || ''
})

async function login() {
    if (!loginForm.value.host) {
        message.notify(`请填写服务地址。`, message.warning)
        return
    }
    if (!loginForm.value.username) {
        message.notify(`请填写用户名。`, message.warning)
        // TODO 验证用户名和密码有效性
        return
    }
    if (!loginForm.value.password) {
        message.notify(`请填写密码。`, message.warning)
    }

    TokenRequest.switchHost(loginForm.value.host)
    try {
        await TokenRequest.login('/api/login', loginForm.value.username, loginForm.value.password, loginForm.value.key)
        message.notify('登录成功。', message.success)
        router.push('/dashboard')
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
}

</script>

<template>
    <div class="center">
        <el-card class="login-card">
            <template #header>
                <span>连接到WTM服务</span>
            </template>
            <el-form :model="loginForm" label-position="lfet" label-width="auto">
                <el-form-item label="服务地址">
                    <el-input v-model="loginForm.host" placeholder="请填写服务地址" clearable />
                </el-form-item>
                <el-form-item label="用户名">
                    <el-input v-model="loginForm.username" placeholder="用户名" clearable />
                </el-form-item>
                <el-form-item label="密码">
                    <el-input v-model="loginForm.password" placeholder="用户密码" clearable show-password />
                </el-form-item>
                <el-form-item label="系统密钥">
                    <el-input v-model="loginForm.key" placeholder="系统密钥（选填）" clearable show-password />
                </el-form-item>
                <el-button type="success" @click="login">开始连接</el-button>
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
