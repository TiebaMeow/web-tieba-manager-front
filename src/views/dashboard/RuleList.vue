<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getRules, setRules, canEdit, ruleEdited } from '@/lib/data/rule';
import router from '@/router';
import { getViewMode } from '@/lib/utils';
import message from '@/lib/message';
import { OPERATION_OPTIONS } from '@/lib/data/operation';

const viewMode = getViewMode(600)
const rules = getRules()
const filterKeyword = ref('')

function editRule(index: number) {
    router.push(`/rules/${index + 1}`)
}

function deleteRule(index: number) {
    if (rules.value && index < rules.value.length) {
        message.confirm(`即将删除规则 ${rules.value[index].name}`, '提示', () => {
            if (rules.value) {
                rules.value.splice(index, 1);
                ruleEdited.value = true
            }
        });
    } else {
        message.notify('规则不存在', message.warning)
    }
}



function emptyRule() {
    message.confirm(`即将清空所有${whitelistMode.value ? '信任' : '违规'}规则`, '提示', () => {
        if (rules.value) {
            ruleEdited.value = true;
            rules.value = rules.value.filter((rule => rule.whitelist !== whitelistMode.value));
        }
    });
}

function addRule() {
    if (rules.value) {
        router.push(`/${whitelistMode.value ? 'whitelist-' : ''}rules/new`)
    }
}

function save() {
    setRules()
    ruleEdited.value = false
}

const whitelistMode = computed(() => {
    return useRoute().name === 'whitelistRules'
})
const currRuleLength = computed(() => {
    return rules.value ? rules.value.filter(rule => rule.whitelist === whitelistMode.value).length : 0
})

function moveUpRule(index: number) {
    if (index > 0 && rules.value) {
        ruleEdited.value = true
        const temp = rules.value[index];
        rules.value[index] = rules.value[index - 1];
        rules.value[index - 1] = temp;
        rules.value[index].last_modify = Math.floor(Date.now() / 1000);
        rules.value[index - 1].last_modify = Math.floor(Date.now() / 1000);
        if (rules.value[index].whitelist !== rules.value[index - 1].whitelist) {
            moveUpRule(index - 1); // 递归调用，确保相邻规则的顺序一致
        }
    }
}


</script>

<template>
    <div v-if="rules" style="max-width: 1000px; flex-grow: 1;">
        <div style="max-width: 600px; padding: 10px;">
            <h2 style="margin-bottom: 5px;">{{ whitelistMode ? '信任' : '违规' }}规则设置</h2>
            <div v-if="canEdit" class="sticky-bar">
                <el-button type="danger" @click="emptyRule">清空规则</el-button>
                <el-button type="primary" @click="addRule">添加规则</el-button>
                <el-button type="success" @click="save">保存</el-button>
            </div>
            <el-divider v-else style="margin-bottom: 20px;"></el-divider>
            <el-input v-model="filterKeyword" placeholder="筛选规则名称" style="margin-bottom: 10px;" clearable />
            <template v-if="currRuleLength">
                <div style="width: 100%; display: flex; margin-bottom: 30px;" v-for="(rule, index) in rules"
                    v-show="rule.whitelist === whitelistMode && (!filterKeyword || rule.name.includes(filterKeyword))" :key="index">
                    <el-card style="flex-grow: 1;">
                        <template #header>
                            # {{ rule.name }}
                        </template>
                        <div style="display: flex;" v-if="viewMode === 'desktop'">
                            <div style="width: 110px;">
                                <el-statistic :value="rule.conditions.length">
                                    <template #title>
                                        条件数
                                    </template>
                                </el-statistic>
                            </div>
                            <div style="width: 110px;" v-show="!whitelistMode">
                                <custom-statistic title="操作"
                                    :value="Array.isArray(rule.operations) ? OPERATION_OPTIONS.custom : OPERATION_OPTIONS[rule.operations as keyof typeof OPERATION_OPTIONS]" />
                            </div>
                            <div style="width: 110px;" v-show="!whitelistMode">
                                <custom-statistic title="手动确认" :value="rule.manual_confirm ? '是' : '否'" />
                            </div>
                            <div style="flex-grow: 1; display: flex; justify-content: flex-end; align-items: flex-end;">
                                <template v-if="canEdit">
                                    <el-button type="primary" @click="moveUpRule(index)">上移</el-button>
                                    <el-button type="primary" @click="editRule(index)">编辑</el-button>
                                    <el-button type="danger" @click="deleteRule(index)">删除</el-button>
                                </template>
                                <template v-else>
                                    <el-button type="primary" @click="editRule(index)">查看</el-button>
                                </template>
                            </div>
                        </div>
                        <div v-else>
                            <div style="width: 100%; display: flex; margin-bottom: 20px;">
                                <div style="width: 33%;">
                                    <el-statistic :value="rule.conditions.length">
                                        <template #title>
                                            条件数
                                        </template>
                                    </el-statistic>
                                </div>
                                <div style="width: 33%" v-show="!whitelistMode">
                                    <custom-statistic title="操作"
                                        :value="Array.isArray(rule.operations) ? OPERATION_OPTIONS.custom : OPERATION_OPTIONS[rule.operations as keyof typeof OPERATION_OPTIONS]" />
                                </div>
                                <div style="width: 33%" v-show="!whitelistMode">
                                    <custom-statistic title="手动确认" :value="rule.manual_confirm ? '是' : '否'" />
                                </div>

                            </div>
                            <div style="flex-grow: 1; display: flex; align-items: flex-end;">
                                <template v-if="canEdit">
                                    <el-button type="primary" @click="moveUpRule(index)">上移</el-button>
                                    <el-button type="primary" @click="editRule(index)">编辑</el-button>
                                    <el-button type="danger" @click="deleteRule(index)">删除</el-button>
                                </template>
                                <template v-else>
                                    <el-button type="primary" @click="editRule(index)">查看</el-button>
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
    <div v-else-if="rules === null" v-loading="true">
        加载中...
    </div>
    <div v-else>
        <h2>加载失败，请尝试刷新页面</h2>
    </div>
</template>
