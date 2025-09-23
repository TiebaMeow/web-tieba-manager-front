<script setup lang="ts">
import { ref, computed } from 'vue';
import {
    type Rule,
    rules,
    canEdit,
    fetchRules,
    setRules,
    conditionCategories,
    categorizedConditionType,
    conditionInfoDict
} from '@/lib/data/rule';
import router from '@/router';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router';
import { copy } from '@/lib/utils';
import message from '@/lib/message';
import CONDITION_COMPONENTS from '../conditionTemplate';
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
            ruleSeq.value = parseInt(to.params.id as string)
            await getRuleCopy()
            edited.value = false
            customOperations.value = []
            activeEdit.value = 'condition'
            next()
        })
    }
})

const ifNew = computed(() => {
    return ['newRule', 'newWhitelistRule'].indexOf(route.name as string) !== -1
})
function newRule(): boolean {
    if (!ifNew.value) {
        return false
    }
    ruleDataCopy.value = {
        name: '新规则',
        operations: 'ignore',
        whitelist: route.name === 'newWhitelistRule',
        conditions: [],
        last_modify: Math.floor(Date.now() / 1000),
        manual_confirm: false
    }
    edited.value = true
    return true
}

const route = useRoute()
const ruleSeq = ref(parseInt(route.params.id as string))
const ruleDataCopy = ref<Rule | undefined>(undefined);
const customOperations = ref<Operation[]>([])
const activeEdit = ref<'condition' | 'operation'>('condition')
const edited = ref(false)

async function getRuleCopy() {
    const rulesValue = await fetchRules()
    if (newRule()) {
        return
    }
    if (!rulesValue.value || !rulesValue.value[ruleSeq.value - 1]) {
        router.push('/rules')
        return
    }
    ruleDataCopy.value = copy(rulesValue.value[ruleSeq.value - 1])
    if (Array.isArray(ruleDataCopy.value.operations)) {
        customOperations.value = ruleDataCopy.value.operations
        ruleDataCopy.value.operations = 'custom'
    }
}
getRuleCopy()

function deleteAll() {
    if (activeEdit.value === 'condition') {
        message.confirm('即将删除所有条件', '提示', () => {
            ruleDataCopy.value!.conditions = [];
            edited.value = true
        });
    } else if (activeEdit.value === 'operation' && ruleDataCopy.value?.operations === 'custom') {
        message.confirm('即将删除所有操作', '提示', () => {
            customOperations.value = [];
            edited.value = true
        });
    } else {
        message.notify('当前操作不可用', message.warning)
    }
}



function saveRule() {
    if (!canEdit.value) {
        message.notify('没有权限修改规则', message.error)
        return
    }
    if (ruleDataCopy.value && rules.value) {
        if (ruleDataCopy.value.operations === 'custom') {
            ruleDataCopy.value.operations = customOperations.value
        }
        ruleDataCopy.value.last_modify = Math.floor(Date.now() / 1000);
        if (ifNew.value) {
            rules.value.push(ruleDataCopy.value)
        } else {
            rules.value[ruleSeq.value - 1] = ruleDataCopy.value;
        }
        setRules()
        edited.value = false
        router.push(ruleDataCopy.value.whitelist ? '/whitelist-rules' : '/rules');
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
        <div style="max-width: 600px; padding: 10px;" v-if="ruleDataCopy">
            <h1>{{ canEdit ? '编辑' : '查看' }}规则</h1>
            <el-form label-width="auto">
                <el-form-item label="规则名">
                    <el-input v-model="ruleDataCopy.name" :disabled="!canEdit" @change="edited = true"></el-input>
                </el-form-item>
                <el-form-item label="操作" v-show="!ruleDataCopy.whitelist">
                    <el-select v-model="ruleDataCopy.operations" placeholder="请选择操作" @change="() => {
                        customOperations = []
                        edited = true
                        activeEdit = 'condition'
                    }" :disabled="!canEdit">
                        <el-option v-for="(name, operation) in OPERATION_OPTIONS" :key="operation" :label="name"
                            :value="operation"></el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <div class="config-bar" v-show="!ruleDataCopy.whitelist">
                <el-checkbox v-model="ruleDataCopy.manual_confirm" label="手动确认" :disabled="!canEdit"
                    @change="edited = true" />
            </div>
            <div style="display: flex;  align-items: flex-end;">
                <template v-if="canEdit">
                    <el-button type="danger" @click="deleteAll">清空</el-button>
                    <!-- <el-button type="primary" @click="addItem">添加</el-button> -->
                     <!-- TODO 添加后下拉底部， -->
                    <el-button type="primary"
                        @click="router.push(ruleDataCopy.whitelist ? '/whitelist-rules' : '/rules')">返回</el-button>
                    <el-button type="success" @click="saveRule">保存</el-button>
                </template>
                <template v-else>
                    <el-button type="primary"
                        @click="router.push(ruleDataCopy.whitelist ? '/whitelist-rules' : '/rules')">返回</el-button>
                </template>
            </div>
            <el-tabs v-if="ruleDataCopy.operations == 'custom'" v-model="activeEdit" stretch style="margin: 20px 0;">
                <el-tab-pane label="条件" name="condition"></el-tab-pane>
                <el-tab-pane label="操作" name="operation"></el-tab-pane>
            </el-tabs>
            <el-divider v-else></el-divider>
            <template v-if="activeEdit === 'condition'">
                <template v-for="(condition, seq) in ruleDataCopy.conditions" :key="seq">
                    <component :is="CONDITION_COMPONENTS[conditionInfoDict[condition.type].series as keyof typeof CONDITION_COMPONENTS]"
                        @change="edited = true" v-model="ruleDataCopy.conditions[seq]"
                        @delete="ruleDataCopy.conditions.splice(seq, 1)" />
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
                                <el-option v-for="category in conditionCategories" :key="category" :label="category"
                                    :value="category"></el-option>
                            </el-select>
                            <el-select v-if="addRuleOption.category" v-model="addRuleOption.type" placeholder="请选择属性">
                                <el-option v-for="type in categorizedConditionType[addRuleOption.category]" :key="type"
                                    :label="conditionInfoDict[type].name" :value="type"></el-option>
                            </el-select>
                            <el-select v-else disabled :modelValue="1">
                                <el-option label="-" :value="1"></el-option>
                            </el-select>
                            <el-button type="primary" style="margin-left: 10px;" @click="() => {
                                if (addRuleOption.category && addRuleOption.type) {
                                    ruleDataCopy!.conditions.push({
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
