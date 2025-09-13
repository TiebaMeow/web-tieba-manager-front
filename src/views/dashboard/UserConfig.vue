<script setup lang=ts>
import message from '@/lib/message'
import TokenRequest from '@/lib/token'
import { fetchHomeInfo } from '@/lib/data/common'
import { ref, onUnmounted } from 'vue'
import { currTokenData, SwitchTokenEvent } from '@/lib/data/tokenManager'


interface ForumConfig {
    block_day: number
    block_reason: string
    bduss: string
    stoken: string
    fname: string
    thread: boolean
    post: boolean
    comment: boolean
}

interface ProcessConfig {
    mandatory_confirm: boolean
    fast_process: boolean
    confirm_expire: number
    content_validate_expire: number
}

interface UserConfig {
    forum: ForumConfig
    process: ProcessConfig
}

const userConfig = ref<RefResponse<UserConfig>>(undefined)
TokenRequest.fetch(userConfig, {
    url: '/api/config/get_user'
})

onUnmounted(SwitchTokenEvent.on((token) => {
    if (token) {
        TokenRequest.fetch(userConfig, {
            url: '/api/config/get_user'
        })
    } else {
        userConfig.value = undefined
    }
}))


async function setUserConfig() {
    if (!userConfig.value) {
        message.notify('设置未加载，无法保存', message.error)
        return
    }
    const response = await TokenRequest.post<BaseResponse<boolean>>({
        url: '/api/config/set_user',
        data: userConfig.value
    })
    if (response.data.code === 200) {
        message.notify('保存成功', message.success)
        fetchHomeInfo()
    } else {
        message.notify('保存失败: ' + response.data.message, message.error)
    }
}

</script>

<template>
    <div style="max-width: 1000px; flex-grow: 1;" v-if="userConfig">
        <div style="max-width: 600px;">
            <div>
                <h3>贴吧设置</h3>
                <el-form label-width="auto">
                    <el-form-item label="扫描贴吧">
                        <el-input v-model="userConfig.forum.fname"
                            :disabled="!currTokenData.permission?.can_edit_forum && !currTokenData.system_access"></el-input>
                    </el-form-item>
                    <el-form-item label="封禁时长">
                        <el-input-number v-model="userConfig.forum.block_day">
                            <template #suffix>
                                <span>
                                    天
                                </span>
                            </template>
                        </el-input-number>
                    </el-form-item>
                    <el-form-item label="封禁理由">
                        <el-input v-model="userConfig.forum.block_reason"></el-input>
                    </el-form-item>
                </el-form>
            </div>
            <div>
                <h3>
                    账号设置
                </h3>
                <el-form label-width="auto">
                    <el-form-item label="BDUSS">
                        <el-input v-model="userConfig.forum.bduss" show-password></el-input>
                    </el-form-item>
                    <el-form-item label="STOKEN">
                        <el-input v-model="userConfig.forum.stoken" show-password></el-input>
                    </el-form-item>
                </el-form>
            </div>
            <div>
                <h3>
                    处理设置
                </h3>
                <el-form label-width="auto">
                    <el-form-item label="强制确认">
                        <el-checkbox v-model="userConfig.process.mandatory_confirm"></el-checkbox>
                    </el-form-item>
                    <el-form-item label="优化处理">
                        <el-checkbox v-model="userConfig.process.fast_process"></el-checkbox>
                        <el-tooltip content="当有规则匹配时，跳过后续规则，可优化性能" placement="top">
                            <el-icon color="gray" style="margin-left: 10px;">
                                <i-ep-question-filled />
                            </el-icon>
                        </el-tooltip>
                    </el-form-item>
                    <el-form-item label="处理类型">
                        <el-checkbox v-model="userConfig.forum.thread" label="主题帖"></el-checkbox>
                        <el-checkbox v-model="userConfig.forum.post" label="回复"></el-checkbox>
                        <el-checkbox v-model="userConfig.forum.comment" label="楼中楼"></el-checkbox>
                    </el-form-item>
                    <el-form-item label="处理有效期">
                        <el-input-number style="width: 120px;" v-model="userConfig.process.content_validate_expire"
                            :controls="false">
                            <template #suffix>
                                <span>
                                    秒
                                </span>
                            </template>
                        </el-input-number>
                        <el-tooltip content="不处理发布时间超过该设置的内容" placement="top">
                            <el-icon color="gray" style="margin-left: 10px;">
                                <i-ep-question-filled />
                            </el-icon>
                        </el-tooltip>
                    </el-form-item>
                    <el-form-item label="确认有效期">
                        <el-input-number style="width: 120px;" v-model="userConfig.process.confirm_expire"
                            :controls="false">
                            <template #suffix>
                                <span>
                                    秒
                                </span>
                            </template>
                        </el-input-number>
                        <el-tooltip content="自动忽略超过该时间的确认项目" placement="top">
                            <el-icon color="gray" style="margin-left: 10px;">
                                <i-ep-question-filled />
                            </el-icon>
                        </el-tooltip>
                    </el-form-item>
                </el-form>
            </div>
            <el-button style="margin-top: 20px; margin-bottom: 200px;" type="success"
                @click="setUserConfig">保存</el-button>
        </div>
    </div>
    <div v-else-if="userConfig === null" v-loading="true">
        Loading...
    </div>
    <div v-else>
        <h2>加载失败，请尝试刷新页面</h2>
    </div>
</template>

<style scoped>
.config-bar {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.config-bar p {
    margin: 0;
    margin-right: 10px;
    flex-shrink: 0;
}

.number {
    width: 230px;
}

.number p {
    flex-grow: 1;
}
</style>
