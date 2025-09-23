<script setup lang="ts">
import { ref } from 'vue';
import { DIALOG_WIDTH } from '@/lib/constance';

import TokenRequest from '@/lib/token';
import message from '@/lib/message';
import { currTokenData } from '@/lib/data/tokenManager';

interface UserData {
    username?: string,
    permission: UserPermission,
    forum: string,
    code: string,
    use?: boolean
}

const currUser = ref<UserData | null>(null)
const usersInfo = ref<RefResponse<UserData[]>>(undefined)

TokenRequest.fetch(usersInfo, {
    url: '/api/system/get_users_info'
})

const ifShowEdit = ref(false)
const ifShowCreateCode = ref(false)

function edit(data: UserData) {
    currUser.value = data
    ifShowEdit.value = true
}

async function setUserInfo() {
    if (!currUser.value || !usersInfo.value) {
        message.notify('用户信息加载失败，请重试', message.error)
        ifShowEdit.value = false
        return
    }
    const response = await TokenRequest.post<BaseResponse<boolean>>({
        url: '/api/system/set_user_info',
        data: {
            username: currUser.value.username,
            forum: currUser.value.forum,
            permission: currUser.value.permission,
            code: currUser.value.code
        }
    })
    if (response.data.code === 200) {
        message.notify('用户信息更新成功', message.success)
        const index = usersInfo.value.findIndex(user => user.username === currUser.value?.username)
        if (index !== -1) {
            usersInfo.value[index] = { ...currUser.value }
        }
    } else {
        message.notify(response.data.message || '信息更新失败，请重试', message.error)
    }
    ifShowEdit.value = false
}

function deleteUser(data: UserData) {
    if (currTokenData.value && currTokenData.value.user === data.username) {
        message.notify('不能删除当前登录的用户', message.error)
        return
    } else if (data.use && usersInfo.value && usersInfo.value.filter(info => info.use).length <= 1) {
        message.notify('至少保留一个用户', message.error)
        // TODO 支持全部删光光
        return
    }
    const target = (data.use ? `用户${data.username}？` : '邀请码')

    message.confirm(`确认删除${target}，该操作不可逆`, '提示', async () => {
        if (!usersInfo.value) {
            message.notify('用户信息加载失败，请重试', message.error)
            ifShowEdit.value = false
            return
        }
        const response = await TokenRequest.post<BaseResponse<boolean>>({
            url: '/api/system/delete_user',
            data: {
                username: data.username,
                code: data.code
            }
        })
        if (response.data.code === 200) {
            message.notify(`${target}删除成功`, message.success)
            const index = usersInfo.value.findIndex(user => user.username === data.username && user.code === data.code)
            if (index !== -1) {
                usersInfo.value.splice(index, 1)
            }
        } else {
            message.notify(response.data.message || `${target}删除失败，请重试`, message.error)
        }

    }, () => { })
}

async function createCode() {
    if (ifShowCreateCode.value) {
        if (!currUser.value || !usersInfo.value) {
            message.notify('用户信息加载失败，请重试', message.error)
            ifShowCreateCode.value = false
            return
        }
        if (currUser.value.code && usersInfo.value.find(user => user.code === currUser.value?.code)) {
            message.notify('邀请码已存在，请更换', message.error)
            return
        }
        const response = await TokenRequest.post<BaseResponse<string>>({
            url: '/api/system/create_invite_code',
            data: {
                username: currUser.value.username,
                code: currUser.value.code,
                forum: currUser.value.forum,
                permission: currUser.value.permission,
            }
        })
        if (response.data.code === 200) {
            message.notify(response.data.message || '邀请码添加成功', message.success)
            usersInfo.value.push({
                username: '',
                permission: currUser.value.permission,
                forum: currUser.value.forum,
                code: response.data.data
            })
        } else {
            message.notify(response.data.message || '邀请码添加失败，请重试', message.error)
        }
        ifShowCreateCode.value = false
    } else {
        currUser.value = {
            username: '',
            permission: {
                can_edit_forum: true,
                can_edit_rule: true
            },
            forum: '',
            code: ''
        }
        ifShowCreateCode.value = true
    }
}

</script>

<template>
    <el-dialog v-model="ifShowEdit" title="编辑用户" :width="Math.min(DIALOG_WIDTH, 400)" @closed="currUser = null">
        <el-form v-if="currUser" :model="currUser" label-width="80px">
            <el-form-item label="用户名">
                <el-input v-model="currUser.username" disabled />
            </el-form-item>
            <el-form-item label="监控贴吧">
                <el-input v-model="currUser.forum" />
            </el-form-item>
            <el-form-item label="权限">
                <el-checkbox v-model="currUser.permission.can_edit_forum">
                    可编辑监控贴吧
                </el-checkbox>
                <el-checkbox v-model="currUser.permission.can_edit_rule">
                    可编辑规则
                </el-checkbox>
            </el-form-item>
            <div style="text-align: right;">
                <el-button @click="ifShowEdit = false" type="primary">取消</el-button>
                <el-button type="success" @click="setUserInfo">保存</el-button>
            </div>
        </el-form>
        <div v-else>加载中...</div>
    </el-dialog>
    <el-dialog v-model="ifShowCreateCode" title="添加邀请码" :width="Math.min(DIALOG_WIDTH, 400)" @closed="currUser = null">
        <el-form v-if="currUser" :model="currUser" label-width="80px">
            <!-- <el-form-item label="用户名">
                TODO 支持预先绑定用户名
                <el-input v-model="currUser.username" placeholder="选填" />
            </el-form-item> -->
            <el-form-item label="邀请码">
                <el-input v-model="currUser.code" placeholder="为空随机生成8位" />
            </el-form-item>
            <el-form-item label="监控贴吧">
                <el-input v-model="currUser.forum" placeholder="选填" />
            </el-form-item>
            <el-form-item label="权限">
                <el-checkbox v-model="currUser.permission.can_edit_forum">
                    可编辑监控贴吧
                </el-checkbox>
                <el-checkbox v-model="currUser.permission.can_edit_rule">
                    可编辑规则
                </el-checkbox>
            </el-form-item>
            <div style="text-align: right;">
                <el-button @click="ifShowCreateCode = false" type="primary">取消</el-button>
                <el-button type="success" @click="createCode">添加</el-button>
            </div>
        </el-form>
        <div v-else>加载中...</div>
    </el-dialog>
    <div style="flex-grow: 1;max-width: 1200px" v-if="usersInfo">
        <div style="max-width: 1000px;">
            <h2>用户管理</h2>
            <el-button type="primary" @click="createCode">添加邀请码</el-button>
            <el-divider />
            <div>
                <el-table :data="usersInfo" style="width: 100%">
                    <el-table-column prop="username" label="用户名">
                        <template #default="{ row }">
                            <span v-if="row.username"> {{ row.username }} </span>
                            <span v-else style="color: gray">&lt;未绑定&gt;</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="forum" label="监控贴吧">
                        <template #default="{ row }">
                            <span v-if="row.forum"> {{ row.forum }} </span>
                            <span v-else style="color: gray">&lt;未设置&gt;</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="code" label="邀请码">
                        <template #default="{ row }">
                            <span v-if="row.code"> {{ row.code }} </span>
                            <span v-else style="color: gray">&lt;未填写&gt;</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="已用" width="80">
                        <template #default="{ row }">
                            <el-tag v-if="row.use" type="success">是</el-tag>
                            <el-tag v-else type="info">否</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100">
                        <template #default="{ row }">
                            <div style="display: flex;">
                                <el-button type="text" @click="edit(row)" v-if="row.use">编辑</el-button>
                                <el-button type="text" style="color: red" @click="deleteUser(row)">删除</el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    </div>
    <h2 v-else-if="usersInfo === null" v-loading="true">加载中...</h2>
    <h2 v-else class="center">加载失败</h2>
</template>
