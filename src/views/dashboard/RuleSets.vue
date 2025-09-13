<script setup lang="ts">
import { ref, computed } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router';
import { getRuleSets, setRuleSets, canEdit } from '@/lib/data/rule';
import router from '@/router';
import { getViewMode } from '@/lib/utils';
import message from '@/lib/message';
import { OPERATION_OPTIONS } from '@/lib/data/operation';

const viewMode = getViewMode(600)
const ruleSets = getRuleSets()
const edited = ref(false)

onBeforeRouteLeave(() => {
    if (edited.value) {
        const answer = window.confirm(
            '是否离开，有更改未保存！'
        )
        // 取消导航并停留在同一页面上
        if (!answer) return false
    }
})

onBeforeRouteUpdate(() => {
    edited.value = false
})


function editRuleSet(index: number) {
    router.push(`/rule-sets/${index + 1}`)
}

function deleteRuleSet(index: number) {
    if (ruleSets.value && index < ruleSets.value.length) {
        message.confirm(`即将删除规则 ${ruleSets.value[index].name}`, '提示', () => {
            if (ruleSets.value) {
                ruleSets.value.splice(index, 1);
                edited.value = true
            }
        });
    } else {
        message.notify('规则不存在', message.warning)
    }
}



function emptyRuleSet() {
    message.confirm(`即将清空所有${whitelistMode.value ? '信任' : '违规'}规则`, '提示', () => {
        if (ruleSets.value) {
            edited.value = true;
            ruleSets.value = ruleSets.value.filter((ruleSet => ruleSet.whitelist !== whitelistMode.value));
        }
    });
}

function addRuleSet() {
    if (ruleSets.value) {
        router.push(`/${whitelistMode.value ? 'whitelist-' : ''}rule-sets/new`)
    }
}

function save() {
    setRuleSets()
    edited.value = false
}

const whitelistMode = computed(() => {
    return useRoute().name === 'whitelistRuleSets'
})
const currRuleSetLength = computed(() => {
    return ruleSets.value ? ruleSets.value.filter(ruleSet => ruleSet.whitelist === whitelistMode.value).length : 0
})

function moveUpRuleSet(index: number) {
    if (index > 0 && ruleSets.value) {
        edited.value = true
        const temp = ruleSets.value[index];
        ruleSets.value[index] = ruleSets.value[index - 1];
        ruleSets.value[index - 1] = temp;
        ruleSets.value[index].last_modify = Math.floor(Date.now() / 1000);
        ruleSets.value[index - 1].last_modify = Math.floor(Date.now() / 1000);
        if (ruleSets.value[index].whitelist !== ruleSets.value[index - 1].whitelist) {
            moveUpRuleSet(index - 1); // 递归调用，确保相邻规则的顺序一致
        }
    }
}


</script>

<template>
    <div v-if="ruleSets" style="max-width: 1000px; flex-grow: 1;">
        <div style="max-width: 600px; padding: 10px;">
            <h2>{{ whitelistMode ? '信任' : '违规' }}规则设置</h2>
            <template v-if="canEdit">
                <el-button type="danger" @click="emptyRuleSet">清空规则</el-button>
                <el-button type="primary" @click="addRuleSet">添加规则</el-button>
                <el-button type="success" @click="save">保存</el-button>
            </template>
            <el-divider style="margin-bottom: 20px;"></el-divider>
            <template v-if="currRuleSetLength">
                <div style="width: 100%; display: flex; margin-bottom: 30px;" v-for="(ruleSet, index) in ruleSets"
                    v-show="ruleSet.whitelist === whitelistMode" :key="index">
                    <el-card style="flex-grow: 1;">
                        <template #header>
                            # {{ ruleSet.name }}
                        </template>
                        <div style="display: flex;" v-if="viewMode === 'desktop'">
                            <div style="width: 110px;">
                                <el-statistic :value="ruleSet.rules.length">
                                    <template #title>
                                        规则数
                                    </template>
                                </el-statistic>
                            </div>
                            <div style="width: 110px;" v-show="!whitelistMode">
                                <custom-statistic title="操作"
                                    :value="Array.isArray(ruleSet.operations) ? OPERATION_OPTIONS.custom : OPERATION_OPTIONS[ruleSet.operations]" />
                            </div>
                            <div style="width: 110px;" v-show="!whitelistMode">
                                <custom-statistic title="手动确认" :value="ruleSet.manual_confirm ? '是' : '否'" />
                            </div>
                            <div style="flex-grow: 1; display: flex; justify-content: flex-end; align-items: flex-end;">
                                <template v-if="canEdit">
                                    <el-button type="primary" @click="moveUpRuleSet(index)">上移</el-button>
                                    <el-button type="primary" @click="editRuleSet(index)">编辑</el-button>
                                    <el-button type="danger" @click="deleteRuleSet(index)">删除</el-button>
                                </template>
                                <template v-else>
                                    <el-button type="primary" @click="editRuleSet(index)">查看</el-button>
                                </template>
                            </div>
                        </div>
                        <div v-else>
                            <div style="width: 100%; display: flex; margin-bottom: 20px;">
                                <div style="width: 33%;">
                                    <el-statistic :value="ruleSet.rules.length">
                                        <template #title>
                                            规则数
                                        </template>
                                    </el-statistic>
                                </div>
                                <div style="width: 33%" v-show="!whitelistMode">
                                    <custom-statistic title="操作"
                                        :value="Array.isArray(ruleSet.operations) ? OPERATION_OPTIONS.custom : OPERATION_OPTIONS[ruleSet.operations]" />
                                </div>
                                <div style="width: 33%" v-show="!whitelistMode">
                                    <custom-statistic title="手动确认" :value="ruleSet.manual_confirm ? '是' : '否'" />
                                </div>

                            </div>
                            <div style="flex-grow: 1; display: flex; align-items: flex-end;">
                                <template v-if="canEdit">
                                    <el-button type="primary" @click="moveUpRuleSet(index)">上移</el-button>
                                    <el-button type="primary" @click="editRuleSet(index)">编辑</el-button>
                                    <el-button type="danger" @click="deleteRuleSet(index)">删除</el-button>
                                </template>
                                <template v-else>
                                    <el-button type="primary" @click="editRuleSet(index)">查看</el-button>
                                </template>
                            </div>
                        </div>
                    </el-card>

                </div>
            </template>
            <div v-else style="display: flex; justify-self: center; align-items: center; margin-top: 100px;">
                <h2>这里还没有规则</h2>
            </div>
        </div>
    </div>
    <div v-else-if="ruleSets === null" v-loading="true">
        加载中...
    </div>
    <div v-else>
        <h2>加载失败，请尝试刷新页面</h2>
    </div>
</template>
