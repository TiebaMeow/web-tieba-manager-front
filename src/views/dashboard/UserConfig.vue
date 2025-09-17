<script setup lang=ts>
import message from '@/lib/message'
import TokenRequest from '@/lib/token'
import { fetchHomeInfo } from '@/lib/data/common'
import { ref, onUnmounted } from 'vue'
import { currTokenData, SwitchTokenEvent } from '@/lib/data/tokenManager'
import { onBeforeRouteLeave } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'

interface UserConfig {
    forum: {
        fname: string;
        block_day: number;
        block_reason: string;
        bduss: string;
        stoken: string;
        thread: boolean;
        post: boolean;
        comment: boolean;
    };
    process: {
        mandatory_confirm: boolean;
        fast_process: boolean;
        content_validate_expire: number;
        confirm_expire: number;
    };
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

const edited = ref(false)

const formRef = ref<FormInstance>()

const rules = ref<FormRules>({
    'forum.fname': [
        { max: 31, message: '长度不能超过31', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value && value.endsWith('吧')) {
                    return callback(new Error('无需加上吧后缀'))
                }
                callback()
            },
            trigger: 'blur'
        }
    ],
    'forum.block_day': [
        { type: 'number', min: 1, max: 90, message: '数值范围为1-90', trigger: 'blur' }
    ],
    'forum.bduss': [
        {
            validator: (rule, value, callback) => {
                if (!value) {
                    return callback()
                }
                if (value.length !== 192 && value.length !== 29) {
                    // 29为打码后数据
                    return callback(new Error('BDUSS长度必须为192'))
                }
                callback()
            },
            trigger: 'blur'
        }
    ],
    'forum.stoken': [
        {
            validator: (rule, value, callback) => {
                if (!value) {
                    return callback()
                }
                if (value.length !== 64 && value.length !== 20) {
                    // 20为打码后数据
                    return callback(new Error('STOKEN长度必须为64'))
                }
                callback()
            },
            trigger: 'blur'
        }
    ],
    'process.content_validate_expire': [
        { type: 'number', min: 1, message: '数值需大于0', trigger: 'blur' }
    ],
    'process.confirm_expire': [
        { type: 'number', min: 1, message: '数值需大于0', trigger: 'blur' }
    ]
})

const setUserConfig = async () => {
    if (!userConfig.value) {
        message.notify('设置未加载，无法保存', message.error)
        return
    }
    if (!formRef.value) return
    await formRef.value.validate((valid) => {
        if (valid && userConfig.value) {
            TokenRequest.post({
                url: '/api/config/set_user',
                data: userConfig.value
            }).then(() => {
                message.notify('保存成功', message.success)
                edited.value = false
                fetchHomeInfo()
            })
        }
    })
}

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

</script>

<template>
    <div style="max-width: 1000px; flex-grow: 1;" v-if="userConfig">
        <el-form ref="formRef" :model="userConfig" :rules="rules" label-width="auto">
            <div style="max-width: 600px;">
                <div>
                    <h3>贴吧设置</h3>
                    <el-form-item label="扫描贴吧" prop="forum.fname">
                        <el-input v-model="userConfig.forum.fname"
                            :disabled="!currTokenData || !currTokenData.permission?.can_edit_forum && !currTokenData.system_access"
                            @change="edited = true"></el-input>
                    </el-form-item>
                    <el-form-item label="封禁时长" prop="forum.block_day">
                        <el-input-number v-model="userConfig.forum.block_day" @change="edited = true">
                            <template #suffix>
                                <span>
                                    天
                                </span>
                            </template>
                        </el-input-number>
                    </el-form-item>
                    <el-form-item label="封禁理由" prop="forum.block_reason">
                        <el-input v-model="userConfig.forum.block_reason" @change="edited = true"></el-input>
                    </el-form-item>
                </div>
                <div>
                    <h3>
                        账号设置
                    </h3>
                    <el-form-item label="BDUSS" prop="forum.bduss">
                        <el-input v-model="userConfig.forum.bduss" show-password @change="edited = true"></el-input>
                    </el-form-item>
                    <el-form-item label="STOKEN" prop="forum.stoken">
                        <el-input v-model="userConfig.forum.stoken" show-password @change="edited = true"></el-input>
                    </el-form-item>
                </div>
                <div>
                    <h3>
                        处理设置
                    </h3>
                    <el-form-item label="强制确认" prop="process.mandatory_confirm">
                        <el-checkbox v-model="userConfig.process.mandatory_confirm"
                            @change="edited = true"></el-checkbox>
                    </el-form-item>
                    <el-form-item label="优化处理" prop="process.fast_process">
                        <el-checkbox v-model="userConfig.process.fast_process" @change="edited = true"></el-checkbox>
                        <el-tooltip content="当有规则匹配时，跳过后续规则，可优化性能" placement="top">
                            <el-icon color="gray" style="margin-left: 10px;">
                                <i-ep-question-filled />
                            </el-icon>
                        </el-tooltip>
                    </el-form-item>
                    <el-form-item label="处理类型">
                        <el-checkbox v-model="userConfig.forum.thread" label="主题帖"
                            @change="edited = true"></el-checkbox>
                        <el-checkbox v-model="userConfig.forum.post" label="回复" @change="edited = true"></el-checkbox>
                        <el-checkbox v-model="userConfig.forum.comment" label="楼中楼"
                            @change="edited = true"></el-checkbox>
                    </el-form-item>
                    <el-form-item label="处理有效期" prop="process.content_validate_expire">
                        <el-input-number style="width: 120px;" v-model="userConfig.process.content_validate_expire"
                            :controls="false" @change="edited = true">
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
                    <el-form-item label="确认有效期" prop="process.confirm_expire">
                        <el-input-number style="width: 120px;" v-model="userConfig.process.confirm_expire"
                            :controls="false" @change="edited = true">
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
                </div>
                <el-button style="margin-top: 20px; margin-bottom: 200px;" type="success"
                    @click="setUserConfig">保存</el-button>
            </div>
        </el-form>
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
