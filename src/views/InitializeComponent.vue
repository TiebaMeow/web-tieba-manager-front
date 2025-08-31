<script setup lang="ts">
import { ref } from 'vue';
import message from '@/lib/message';
import Requests from '@/lib/request';
import NumberInput from '@/components/NumberInput.vue';
import router from '@/router';

const request = new Requests({
    host: 'http://127.0.0.1:36799'
})

const initializeInfo = ref<{ need_user: boolean, need_system: boolean } | null>(null)
const currForm = ref<'user' | 'system' | null | false>(null)

request.get<BaseResponse<{
    need_user: boolean,
    need_system: boolean
}>>({
    url: '/api/initialize/get_info',
}).then((resp) => {
    initializeInfo.value = resp.data.data
    if (initializeInfo.value.need_user) {
        currForm.value = 'user'
    } else if (initializeInfo.value.need_system) {
        currForm.value = 'system'
    } else {
        setTimeout(() =>
            router.push('/login')
            , 5000)
    }
}).catch((err) => {
    console.log(err);

    message.notify(`请求失败，发生错误 ${err.code} ${err.message}`, message.error)
    currForm.value = false
})

const userForm = ref<{
    username: string
    password: string
}>({
    username: '',
    password: ''
})
const systemForm = ref<{
    host: string,
    port: number,
    key: string,
    token_expire_days: number
}>({
    host: location.host == '127.0.0.1' ? '127.0.0.1' : '0.0.0.0',
    port: parseFloat(location.port),
    key: '',
    token_expire_days: 7

})
const confirmPassword = ref<{
    user?: string,
    system?: string
}>({})

function initialize() {
    const data: {
        user?: {
            username: string,
            password: string
        },
        system?: {
            host: string,
            port: number,
            key: string,
            token_expire_days: number
        }
    } = {}
    if (initializeInfo.value?.need_user) {
        data.user = userForm.value
    }
    if (initializeInfo.value?.need_system) {
        data.system = systemForm.value
    }

    request.post({
        url: '/api/initialize/initialize',
        data
    }).then(() => {
        message.notify('初始化成功，正在转跳...', message.success)
        const params: string[] = []
        if (userForm.value.password) {
            params.push(`username=${userForm.value.username}`)
            params.push(`password=${userForm.value.password}`)
        }
        if (systemForm.value.port.toString() !== location.port) {
            params.push(`host=${location.protocol}//${location.hostname}:${systemForm.value.port}`)
        }
        if (params.length) {
            router.push('/login?' + params.join('&'))
        } else {
            router.push('/login')
        }
    }).catch((err) => {
        console.log(err)
        if (err.status == 422) {
            message.notify('输入错误，请检查输入', message.error)
        } else if (err.status == 400) {
            if (err.response.data.detail) {
                message.notify(err.response.data.detail, message.error)
            } else {
                message.notify('初始化失败，请检查输入', message.error)
            }
        } else {
            // err.
            message.notify(`初始化失败 ${err.code} ${err.message}`, message.error)
        }
    })
}

function nextStep() {
    if (currForm.value == 'user') {
        if (userForm.value.password !== confirmPassword.value.user) {
            message.notify('两次输入的密码不一致，请确认密码', message.error)
            return
        }
        // TODO 验证用户名与密码有效性
        if (!userForm.value.username) {
            message.notify('请输入用户名', message.warning)
            return
        }
        if (!userForm.value.password) {
            message.notify('请输入密码', message.warning)
            return
        }
        if (initializeInfo.value?.need_system) {
            currForm.value = 'system'
        } else {
            initialize()
        }
    } else {
        if (systemForm.value.key !== confirmPassword.value.system) {
            message.notify('两次输入的密钥不一致，请确认密钥', message.error)
            return
        }
        initialize()
    }
}

</script>

<template>
    <div class="center">
        <el-card class="login-card">
            <template #header>
                <span>初始化{{ currForm == 'user' ? '用户' : '系统' }}配置</span>
            </template>
            <div v-if="!currForm" style="height: 200px; display: flex; justify-content: center; align-items: center">
                <h2 v-if="currForm === false">数据加载失败 </h2>
                <h2 v-else-if="initializeInfo === null" v-loading="true">正在加载...</h2>
                <div v-else style="text-align: center;">
                    <h2>系统已初始化</h2>
                    五秒后将转跳至登录页面
                </div>
            </div>
            <template v-else>

                <el-form v-if="currForm == 'user'" :model="userForm" label-position="right" label-width="auto">
                    <el-form-item label="用户名">
                        <el-input v-model="userForm.username" placeholder="请填写用户名" clearable />
                    </el-form-item>
                    <el-form-item label="密码">
                        <el-input v-model="userForm.password" placeholder="请填写密码" show-password clearable />
                    </el-form-item>
                    <el-form-item label=" ">
                        <el-input v-model="confirmPassword.user" placeholder="二次确认密码" show-password clearable />
                    </el-form-item>
                </el-form>
                <el-form v-else :model="systemForm" label-position="right" label-width="auto">
                    <el-form-item label="主机">
                        <el-radio-group v-model="systemForm.host">
                            <el-radio value="0.0.0.0">0.0.0.0</el-radio>
                            <br />
                            <el-radio value="127.0.0.1">127.0.0.1</el-radio>
                        </el-radio-group>
                        <el-alert v-if="systemForm.host == '127.0.0.1'" style="margin-top: 5px;" type="warning"
                            title="选择此项将导致外部电脑无法访问服务" show-icon :closable="false" />
                    </el-form-item>
                    <el-form-item label="端口">
                        <number-input v-model="systemForm.port" placeholder="36799" clearable />
                    </el-form-item>
                    <el-form-item label="密钥">
                        <el-input v-model="systemForm.key" placeholder="请填写密钥" show-password clearable />
                    </el-form-item>
                    <el-form-item label=" ">
                        <el-input v-model="confirmPassword.system" placeholder="二次确认密钥" show-password clearable />
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
                <el-button type="primary" v-if="currForm == 'system' && initializeInfo?.need_user"
                    @click="currForm = 'user'">上一步</el-button>
                <el-button type="success" v-if="currForm == 'system' || !initializeInfo?.need_system"
                    @click="nextStep">提交</el-button>
                <el-button type="primary" v-else @click="nextStep">下一步</el-button>
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
