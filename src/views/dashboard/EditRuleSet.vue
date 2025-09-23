<script setup lang="ts">
import { ref, computed } from 'vue';
import {
    type RuleSet,
    ruleSets,
    fetchRuleSets,
    setRuleSets,
    ruleCategories,
    categorizedRuleType,
    ruleInfoDict,
    canEdit
} from '@/lib/data/rule';
import router from '@/router';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router';
import { copy } from '@/lib/utils';
import message from '@/lib/message';
import RULE_COMPONENTS from '../ruleTemplate';
import { CUSTOM_OPERATION_OPTIONS, OPERATION_OPTIONS, type Operation } from '@/lib/data/operation';
import OPERATION_COMPONENTS from '../operationTemplate';

function confirmLeave(next: (to?: string | boolean) => void) {
    if (edited.value) {
        message.confirm('设置未保存，确认离开？', '提示', () => {
            next()
        }, () => {
            next(false)
        })
    } else {
        next()
    }
}

onBeforeRouteLeave((to, from, next) => {
    confirmLeave(next)
})

onBeforeRouteUpdate((to, from, next) => {
    if (to.params.id !== from.params.id) {
        confirmLeave(async (res) => {
            if (res === false) {
                next(false)
                return
            }
            ruleSetSeq.value = parseInt(to.params.id as string)
            await getRuleSetCopy()
            edited.value = false
            customOperations.value = []
            activeEdit.value = 'rule'
            next()
        })
    }
})

const ifNew = computed(() => {
    return ['newRuleSet', 'newWhitelistRuleSet'].indexOf(route.name as string) !== -1
})
function newRuleSet(): boolean {
    if (!ifNew.value) {
        return false
    }
    ruleSetDataCopy.value = {
        name: '新规则',
        operations: 'ignore',
        whitelist: route.name === 'newWhitelistRuleSet',
        rules: [],
        last_modify: Math.floor(Date.now() / 1000),
        manual_confirm: false
    }
    edited.value = true
    return true
}

const route = useRoute()
const ruleSetSeq = ref(parseInt(route.params.id as string))
const ruleSetDataCopy = ref<RuleSet | undefined>(undefined);
const customOperations = ref<Operation[]>([])
const activeEdit = ref<'rule' | 'operation'>('rule')
const edited = ref(false)

async function getRuleSetCopy() {
    const ruleSets = await fetchRuleSets()
    if (newRuleSet()) {
        return
    }
    if (!ruleSets.value || !ruleSets.value[ruleSetSeq.value - 1]) {
        router.push('/rule-sets')
        return
    }
    ruleSetDataCopy.value = copy(ruleSets.value[ruleSetSeq.value - 1])
    if (Array.isArray(ruleSetDataCopy.value.operations)) {
        customOperations.value = ruleSetDataCopy.value.operations
        ruleSetDataCopy.value.operations = 'custom'
    }
}
getRuleSetCopy()

function deleteAllRules() {
    message.confirm('即将删除所有条件', '提示', () => {
        ruleSetDataCopy.value!.rules = [];
        edited.value = true
    });
}

function saveRuleSet() {
    if (!canEdit.value) {
        message.notify('没有权限修改规则', message.error)
        return
    }
    if (ruleSetDataCopy.value && ruleSets.value) {
        if (ruleSetDataCopy.value.operations === 'custom') {
            ruleSetDataCopy.value.operations = customOperations.value
        }
        ruleSetDataCopy.value.last_modify = Math.floor(Date.now() / 1000);
        if (ifNew.value) {
            ruleSets.value.push(ruleSetDataCopy.value)
        } else {
            ruleSets.value[ruleSetSeq.value - 1] = ruleSetDataCopy.value;
        }
        setRuleSets()
        edited.value = false
        router.push(ruleSetDataCopy.value.whitelist ? '/whitelist-rule-sets' : '/rule-sets');
    } else {
        message.notify('数据加载失败，尝试刷新页面', message.error)
    }
}

const addRule = ref(false)
const addOperation = ref(false)
const addRuleOption = ref<{
    category?: string
    type?: string
}>({});
const addOperationOption = ref<undefined | keyof typeof CUSTOM_OPERATION_OPTIONS>(undefined)
</script>

<template>
    <div style="max-width: 1000px; flex-grow: 1;">
        <div style="max-width: 600px; padding: 10px;" v-if="ruleSetDataCopy">
            <h1>{{ canEdit ? '编辑' : '查看' }}规则</h1>
            <el-form label-width="auto">
                <el-form-item label="规则名">
                    <el-input v-model="ruleSetDataCopy.name" :disabled="!canEdit" @change="edited = true"></el-input>
                </el-form-item>
                <el-form-item label="操作" v-show="!ruleSetDataCopy.whitelist">
                    <el-select v-model="ruleSetDataCopy.operations" placeholder="请选择操作" @change="() => {
                        customOperations = []
                        edited = true
                        activeEdit = 'rule'
                    }" :disabled="!canEdit">
                        <el-option v-for="(name, operation) in OPERATION_OPTIONS" :key="operation" :label="name"
                            :value="operation"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <div class="config-bar" v-show="!ruleSetDataCopy.whitelist">
                <el-checkbox v-model="ruleSetDataCopy.manual_confirm" label="手动确认" :disabled="!canEdit"
                    @change="edited = true" />
            </div>
            <div style="display: flex;  align-items: flex-end;">
                <template v-if="canEdit">
                    <el-button type="danger" @click="deleteAllRules">清空</el-button>
                    <!-- <el-button type="primary" @click="addItem">添加</el-button> -->
                    <el-button type="primary"
                        @click="router.push(ruleSetDataCopy.whitelist ? '/whitelist-rule-sets' : '/rule-sets')">返回</el-button>
                    <el-button type="success" @click="saveRuleSet">保存</el-button>
                </template>
                <template v-else>
                    <el-button type="primary"
                        @click="router.push(ruleSetDataCopy.whitelist ? '/whitelist-rule-sets' : '/rule-sets')">返回</el-button>
                </template>
            </div>
            <el-tabs v-if="ruleSetDataCopy.operations == 'custom'" v-model="activeEdit" stretch style="margin: 20px 0;">
                <el-tab-pane label="条件" name="rule"></el-tab-pane>
                <el-tab-pane label="操作" name="operation"></el-tab-pane>
            </el-tabs>
            <el-divider v-else></el-divider>
            <template v-if="activeEdit === 'rule'">
                <template v-for="(rule, seq) in ruleSetDataCopy.rules" :key="seq">
                    <component :is="RULE_COMPONENTS[ruleInfoDict[rule.type].series as keyof typeof RULE_COMPONENTS]"
                        @change="edited = true" v-model="ruleSetDataCopy.rules[seq]"
                        @delete="ruleSetDataCopy.rules.splice(seq, 1)" />
                </template>
                <el-card>
                    <div v-if="addRule" class="center add-slot">
                        <h3>( Φ ω Φ )</h3>
                        <div style="display: flex; width: 100%;">
                            <el-button type="plain" style="margin-right: 10px;" @click="() => {
                                addRule = false
                                addRuleOption = {};
                            }">取消</el-button>
                            <el-select v-model="addRuleOption.category" placeholder="请选择类型"
                                @change="() => addRuleOption.type = undefined" style="margin-right: 10px;">
                                <el-option v-for="category in ruleCategories" :key="category" :label="category"
                                    :value="category"></el-option>
                            </el-select>
                            <el-select v-if="addRuleOption.category" v-model="addRuleOption.type" placeholder="请选择属性">
                                <el-option v-for="type in categorizedRuleType[addRuleOption.category]" :key="type"
                                    :label="ruleInfoDict[type].name" :value="type"></el-option>
                            </el-select>
                            <el-select v-else disabled :modelValue="1">
                                <el-option label="-" :value="1"></el-option>
                            </el-select>
                            <el-button type="primary" style="margin-left: 10px;" @click="() => {
                                if (addRuleOption.category && addRuleOption.type) {
                                    ruleSetDataCopy!.rules.push({
                                        type: addRuleOption.type,
                                        options: {},
                                    })
                                    addRule = false
                                    addRuleOption = {};
                                    edited = true
                                } else {
                                    message.notify('请先选择规则类型和子类型', message.warning)
                                }
                            }">添加</el-button>
                        </div>
                    </div>
                    <div v-else class="center add-slot">
                        <h3>/ᐠ｡ꞈ｡ᐟ\</h3>
                        <div style="width: 100%; text-align: center">
                            <el-button @click="addRule = true" type="plain">点我添加条件</el-button>
                        </div>
                    </div>
                </el-card>
            </template>
            <template v-else>
                <template v-for="(operation, seq) in customOperations" :key="seq">
                    <component :is="OPERATION_COMPONENTS[operation.type]" @change="edited = true"
                        v-model="customOperations[seq]" @delete="customOperations.splice(seq, 1)" />
                </template>
                <el-card>
                    <div v-if="addOperation" class="center add-slot">
                        <h3> ( Φ ω Φ ) </h3>
                        <div style="display: flex; width: 100%;">
                            <el-button type="plain" style="margin-right: 10px;" @click="() => {
                                addOperation = false
                                addOperationOption = undefined
                            }">取消</el-button>
                            <el-select v-model="addOperationOption" placeholder="请选择操作">
                                <el-option v-for="(name, type) in CUSTOM_OPERATION_OPTIONS" :key="type" :label="name"
                                    :value="type"></el-option>
                            </el-select>
                            <el-button type="primary" style="margin-left: 10px;" @click="() => {
                                if (addOperationOption) {
                                    customOperations.push({
                                        type: addOperationOption,
                                        direct: false,
                                        options: {}
                                    })
                                    addOperation = false
                                    addOperationOption = undefined
                                    edited = true
                                } else {
                                    message.notify('请选择操作', message.warning)
                                }
                            }">添加</el-button>
                        </div>
                    </div>
                    <div v-else class="center add-slot">
                        <h3>/ᐠ｡ꞈ｡ᐟ\</h3>
                        <div style="width: 100%; text-align: center;">
                            <el-button @click="addOperation = true" type="plain">点我添加操作</el-button>
                        </div>
                    </div>
                </el-card>
            </template>
            <div style="margin-bottom: 200px;"></div>
        </div>
        <div v-else v-loading="true"
            style="max-width: 600px; padding: 10px; display: flex; justify-self: center; align-items: center;">
            <h2>加载中...</h2>
        </div>
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

.add-slot {
    flex-wrap: wrap;
    padding: 10px;
}

.add-slot h3 {
    margin: 0 0 20px 0
}
</style>
