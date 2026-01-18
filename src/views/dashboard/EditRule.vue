<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
    type Rule,
    getRules,
    canEdit,
    fetchRules,
    setRules,
    conditionCategories,
    categorizedConditionType,
    conditionInfoDict,
    operationInfoDict,
    operationCategories,
    categorizedOperationType,
    ruleEdited,
    confirmLeaveRuleRoute,
    isRuleRoute

} from '@/lib/data/rule';
import router from '@/router';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router';
import { copy, hasOwn } from '@/lib/utils';
import message from '@/lib/message';
import CONDITION_COMPONENTS from '../conditionTemplate';
import { OPERATION_OPTIONS, type Operation } from '@/lib/data/operation';
import OPERATION_COMPONENTS from '../operationTemplate';


async function refreshRule() {
    syncCopy2Rules()
    ruleSeq.value = parseInt(route.params.id as string)
    await getRuleCopy()
    activeEdit.value = 'condition'
    hasNewed.value = false
}

onBeforeRouteLeave(async (to, from) => {
    if (from.path.endsWith('new')) {
        if (!isRuleRoute(to.path)) {
            // 从 new -> 非规则页面，则不做任何操作
            return await confirmLeaveRuleRoute()
        }
        if (hasNewed.value) {
            // 从 new -> rules/xx，且已经new过了，则刷新ruleSeq
            ruleSeq.value = parseInt(to.params.id as string)
        } else {
            // 从 new -> rules/xx，且没有new过，则刷新规则
            hasNewed.value = true
            await refreshRule()
        }
        return
    }
    await refreshRule()
    // 其余交由rule.ts路由守卫处理
})
onBeforeRouteUpdate(async () => {
    await refreshRule();
})

const rules = getRules()

const ifNew = computed(() => {
    return ['newRule', 'newWhitelistRule'].indexOf(route.name as string) !== -1
})
const hasNewed = ref(false) // 防止重复new

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
        manual_confirm: false,
        force_record_context: false,
        logic: null,
    }
    ruleEdited.value = true
    return true
}

const route = useRoute()
const ruleSeq = ref(parseInt(route.params.id as string))
const ruleDataCopy = ref<Rule | undefined>(undefined);
const customOperations = ref<Operation[]>([])
const activeEdit = ref<'condition' | 'operation'>('condition')

async function getRuleCopy() {
    const rulesValue = await fetchRules()
    if (newRule()) {
        ruleEdited.value = true
        return
    }
    if (!rulesValue.value || !rulesValue.value[ruleSeq.value - 1]) {
        router.push({
            path: '/rules',
        })
        return
    }
    ruleDataCopy.value = copy(rulesValue.value[ruleSeq.value - 1])
    if (Array.isArray(ruleDataCopy.value.operations)) {
        customOperations.value = ruleDataCopy.value.operations
        ruleDataCopy.value.operations = 'custom'
    }
}
getRuleCopy()

const logicType = computed({
    get() {
        if (!ruleDataCopy.value) return 1
        if (!ruleDataCopy.value.logic) return 1
        if (ruleDataCopy.value.logic.advanced) return 3
        return 2
    },
    set(val: number) {
        if (!ruleDataCopy.value) return
        if (val === 1) {
            ruleDataCopy.value.logic = null
        } else if (val === 2) {
            const indices = ruleDataCopy.value.conditions.map((_, i) => i)
            ruleDataCopy.value.logic = {
                advanced: false,
                expression: indices.join(' or ')
            }
        } else if (val === 3) {
            if (!ruleDataCopy.value.logic) {
                const indices = ruleDataCopy.value.conditions.map((_, i) => i)
                ruleDataCopy.value.logic = {
                    advanced: true,
                    expression: indices.join(' or ')
                }
            } else {
                ruleDataCopy.value.logic.advanced = true
            }
        }
        ruleEdited.value = true
    }
})

function getOperator(index: number): 'and' | 'or' {
    if (!ruleDataCopy.value?.logic) return 'or'
    const expr = ruleDataCopy.value.logic.expression
    const regex = new RegExp(`\\b${index}\\b(.*?)\\b${index + 1}\\b`)
    const match = expr.match(regex)
    if (match) {
        if (match[1].includes('and')) return 'and'
        if (match[1].includes('or')) return 'or'
    }
    return 'or'
}

function toggleOperator(index: number) {
    if (!ruleDataCopy.value?.logic) return
    const currentOp = getOperator(index)
    const newOp = currentOp === 'and' ? 'or' : 'and'

    const conditions = ruleDataCopy.value.conditions
    const ops: string[] = []
    for (let i = 0; i < conditions.length - 1; i++) {
        if (i === index) {
            ops.push(newOp)
        } else {
            ops.push(getOperator(i))
        }
    }

    let newExpr = '0'
    for (let i = 0; i < ops.length; i++) {
        newExpr += ` ${ops[i]} ${i + 1}`
    }

    ruleDataCopy.value.logic.expression = newExpr
    ruleEdited.value = true
}

function validateInput(val: string) {
    const valid = /^[0-9\s()andort]*$/.test(val)
    if (!valid) {
        ruleDataCopy.value!.logic!.expression = val.replace(/[^0-9\s()andort]/g, '')
    }
}

function onAddCondition() {
    if (addConditionOption.value.category && addConditionOption.value.type) {
        const newIndex = ruleDataCopy.value!.conditions.length
        ruleDataCopy.value!.conditions.push({
            type: addConditionOption.value.type,
            options: {},
        })

        if (ruleDataCopy.value?.logic) {
            if (ruleDataCopy.value.logic.expression) {
                ruleDataCopy.value.logic.expression += ` or ${newIndex}`
            } else {
                ruleDataCopy.value.logic.expression = `${newIndex}`
            }
        }

        addCondition.value = false
        addConditionOption.value = {};
        ruleEdited.value = true
    } else {
        message.notify('请先选择规则类型和子类型', message.warning)
    }
}

function onDeleteCondition(index: number) {
    const logic = ruleDataCopy.value?.logic
    if (logic) {
        const expr = logic.expression
        // 分词：按分隔符拆分，但保留分隔符
        const tokens = expr.match(/(\(|\)|and|or|nor|not|\d+)/g) || []

        // 找到数字标记的索引
        let tokenIndex = -1
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === index.toString()) {
                tokenIndex = i
                break
            }
        }

        if (tokenIndex !== -1) {
            const indicesToRemove = [tokenIndex]

            // 1. 检查前面的 'not'
            if (tokenIndex > 0 && tokens[tokenIndex - 1].toLowerCase() === 'not') {
                indicesToRemove.push(tokenIndex - 1)
            }

            // 2. 检查运算符
            // 我们需要在左侧或右侧找到最近的运算符，跳过可能已经标记的 'not'
            const leftSearch = (indicesToRemove.includes(tokenIndex - 1) ? tokenIndex - 2 : tokenIndex - 1)
            const rightSearch = tokenIndex + 1

            let leftOpIndex = -1
            let rightOpIndex = -1

            if (leftSearch >= 0 && ['and', 'or', 'nor'].includes(tokens[leftSearch].toLowerCase())) {
                leftOpIndex = leftSearch
            }
            if (rightSearch < tokens.length && ['and', 'or', 'nor'].includes(tokens[rightSearch].toLowerCase())) {
                rightOpIndex = rightSearch
            }

            if (leftOpIndex !== -1 && rightOpIndex !== -1) {
                // 都存在时，优先处理 AND
                if (tokens[leftOpIndex].toLowerCase() === 'and') {
                    indicesToRemove.push(leftOpIndex)
                } else if (tokens[rightOpIndex].toLowerCase() === 'and') {
                    indicesToRemove.push(rightOpIndex)
                } else {
                    // 如果都不是 AND（都是 OR/NOR），移除左边的
                    indicesToRemove.push(leftOpIndex)
                }
            } else if (leftOpIndex !== -1) {
                indicesToRemove.push(leftOpIndex)
            } else if (rightOpIndex !== -1) {
                indicesToRemove.push(rightOpIndex)
            }

            // 移除标记（先降序排序索引以安全删除）
            indicesToRemove.sort((a, b) => b - a)
            for (const idx of indicesToRemove) {
                tokens.splice(idx, 1)
            }

            // 3. 检查 '( X )' -> 'X' 的简化情况
            for (let i = 0; i < tokens.length - 2; i++) {
                if (tokens[i] === '(' && tokens[i + 2] === ')' && /^\d+$/.test(tokens[i + 1])) {
                    // 移除 '(' 和 ')'
                    tokens.splice(i + 2, 1)
                    tokens.splice(i, 1)
                    i-- // 调整索引
                }
            }

            // 4. 调整索引
            for (let i = 0; i < tokens.length; i++) {
                if (/^\d+$/.test(tokens[i])) {
                    const val = parseInt(tokens[i])
                    if (val > index) {
                        tokens[i] = (val - 1).toString()
                    }
                }
            }

            logic.expression = tokens.join(' ')
        }
    }

    ruleDataCopy.value!.conditions.splice(index, 1)
    if (ruleDataCopy.value!.conditions.length === 0 && ruleDataCopy.value?.logic) {
        ruleDataCopy.value.logic.expression = ''
    }
    ruleEdited.value = true
}

const conditionGroups = computed(() => {
    if (!ruleDataCopy.value) return []
    if (logicType.value !== 2) {
        // 仅在 logicType === 2（部分匹配）时才使用条件分组；其他类型下 template 不依赖 conditionGroups，
        // 因此这里直接返回空数组，由渲染逻辑根据 logicType 走简单列表分支。
        return []
    }

    const groups: number[][] = []
    let currentGroup: number[] = [0]
    const conditions = ruleDataCopy.value.conditions

    // 遍历连接符
    // 逻辑是 (A and B) or (C and D)
    // and 是组内连接，or 是组间连接
    for (let i = 0; i < conditions.length - 1; i++) {
        const op = getOperator(i)
        if (op === 'and') {
            currentGroup.push(i + 1)
        } else {
            groups.push(currentGroup)
            currentGroup = [i + 1]
        }
    }
    if (conditions.length > 0) {
        groups.push(currentGroup)
    }
    return groups
})

function deleteAll() {
    if (activeEdit.value === 'condition') {
        message.confirm('即将删除所有条件', '提示', () => {
            ruleDataCopy.value!.conditions = [];
            if (ruleDataCopy.value?.logic) {
                ruleDataCopy.value.logic.expression = ''
            }
            ruleEdited.value = true
        });
    } else if (activeEdit.value === 'operation' && ruleDataCopy.value?.operations === 'custom') {
        message.confirm('即将删除所有操作', '提示', () => {
            customOperations.value = [];
            ruleEdited.value = true
        });
    } else {
        message.notify('当前操作不可用', message.warning)
    }
}


function syncCopy2Rules() {
    if (!rules.value) {
        message.notify('规则列表未加载，无法保存', message.error)
        return
    }
    if (ruleDataCopy.value) {
        const rule = copy(ruleDataCopy.value)
        if (rule.operations === 'custom') {
            rule.operations = customOperations.value
        }
        rule.last_modify = Math.floor(Date.now() / 1000);
        if (ifNew.value) {
            rules.value.push(rule)
        } else {
            rules.value[ruleSeq.value - 1] = rule
        }
    } else {
        message.notify('规则数据未加载，无法保存', message.error)
    }
}

async function saveRule() {
    if (!canEdit.value) {
        message.notify('没有权限修改规则', message.error)
        return
    }
    if (ruleDataCopy.value && rules.value) {
        syncCopy2Rules()
        await setRules()
        if (ifNew.value) {
            hasNewed.value = true
            router.push(`/rules/${(rules.value.length || 1)}`)
        }
    } else {
        message.notify('数据加载失败，尝试刷新页面', message.error)
    }
}

const addCondition = ref(false)
const addOperation = ref(false)
const addConditionOption = ref<{
    category?: string
    type?: string
}>({});
const addOperationOption = ref<{ category?: string, type?: string }>({})

watch(addOperation, (val) => {
    if (!val) return;
    if (operationCategories.value && operationCategories.value.length === 1) {
        addOperationOption.value.category = operationCategories.value[0]
        addOperationOption.value.type = undefined
    } else {
        addOperationOption.value = {}
    }
})

</script>

<template>
    <div style="max-width: 1000px; flex-grow: 1;">
        <div style="max-width: 600px; padding: 10px;" v-if="ruleDataCopy">
            <h1>{{ canEdit ? '编辑' : '查看' }}规则</h1>
            <el-form label-width="auto">
                <el-form-item label="规则名">
                    <el-input v-model="ruleDataCopy.name" :disabled="!canEdit" @change="ruleEdited = true"></el-input>
                </el-form-item>
                <el-form-item label="操作" v-show="!ruleDataCopy.whitelist">
                    <el-select v-model="ruleDataCopy.operations" placeholder="请选择操作" @change="() => {
                        customOperations = []
                        ruleEdited = true
                        activeEdit = 'condition'
                    }" :disabled="!canEdit">
                        <el-option v-for="(name, operation) in OPERATION_OPTIONS" :key="operation" :label="name"
                            :value="operation"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="逻辑关系" v-show="!ruleDataCopy.whitelist">
                    <el-select v-model="logicType" :disabled="!canEdit">
                        <el-option label="全部匹配" :value="1"></el-option>
                        <el-option label="部分匹配" :value="2"></el-option>
                        <el-option label="自定义表达式" :value="3"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="表达式" v-if="logicType === 3 && ruleDataCopy.logic" v-show="!ruleDataCopy.whitelist">
                    <div style="display: flex; align-items: center; width: 100%;">
                        <el-input v-model="ruleDataCopy.logic.expression" @input="validateInput"
                            :disabled="!canEdit"></el-input>
                        <el-tooltip content="支持 () and or nor not 和数字序号" placement="top">
                            <el-icon color="gray" style="margin-left: 10px;">
                                <i-ep-question-filled />
                            </el-icon>
                        </el-tooltip>
                    </div>
                </el-form-item>
            </el-form>
            <div class="config-bar" v-show="!ruleDataCopy.whitelist" style="margin-bottom: 0;">
                <el-checkbox v-model="ruleDataCopy.manual_confirm" label="手动确认" :disabled="!canEdit"
                    @change="ruleEdited = true" />
                <el-checkbox v-model="ruleDataCopy.force_record_context" label="强制记录处理过程" :disabled="!canEdit"
                    @change="ruleEdited = true" />
            </div>
            <div class="sticky-bar" style="padding-top: 20px; margin-bottom: 20px;" :style="{
                borderBottom: ruleDataCopy.operations == 'custom' ? 'none' : '1px solid var(--bolder-color)',
                paddingBottom: ruleDataCopy.operations == 'custom' ? '0' : '15px'
            }">
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
                <el-tabs v-if="ruleDataCopy.operations == 'custom'" v-model="activeEdit" stretch
                    style="margin-top: 5px; width: calc(100% + 40px); position: relative; left: -20px;">
                    <el-tab-pane label="条件" name="condition"></el-tab-pane>
                    <el-tab-pane label="操作" name="operation"></el-tab-pane>
                </el-tabs>
            </div>
            <template v-if="activeEdit === 'condition'">
                <template v-if="logicType === 2">
                    <div v-for="(group, gIndex) in conditionGroups" :key="gIndex" class="condition-group-container">
                        <div v-if="gIndex > 0" class="group-connector">
                            <el-button size="small" @click="toggleOperator(group[0] - 1)"
                                :disabled="!canEdit">或者</el-button>
                        </div>
                        <div class="condition-group">
                            <div v-for="(cIndex, cInIndex) in group" :key="cIndex" class="condition-item-container">
                                <div v-if="cInIndex > 0" class="item-connector">
                                    <el-button size="small" @click="toggleOperator(cIndex - 1)"
                                        :disabled="!canEdit">并且</el-button>
                                </div>
                                <component style="flex-grow: 1;" :is="hasOwn(CONDITION_COMPONENTS, conditionInfoDict[ruleDataCopy.conditions[cIndex].type]?.series)
                                    ? CONDITION_COMPONENTS[conditionInfoDict[ruleDataCopy.conditions[cIndex].type]?.series]
                                    : CONDITION_COMPONENTS.unknown" @change="ruleEdited = true"
                                    v-model="ruleDataCopy.conditions[cIndex]" @delete="onDeleteCondition(cIndex)" />
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <template v-for="(condition, seq) in ruleDataCopy.conditions" :key="seq">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <div v-if="logicType === 3" style="margin-right: 10px; flex-shrink: 0; font-weight: bold;">
                                #{{ seq }}
                            </div>
                            <component style="flex-grow: 1;" :is="hasOwn(CONDITION_COMPONENTS, conditionInfoDict[condition.type]?.series)
                                ? CONDITION_COMPONENTS[conditionInfoDict[condition.type]?.series]
                                : CONDITION_COMPONENTS.unknown" @change="ruleEdited = true"
                                v-model="ruleDataCopy.conditions[seq]" @delete="onDeleteCondition(seq)" />
                        </div>
                    </template>
                </template>
                <el-card>
                    <div v-if="addCondition" class="center add-slot">
                        <h3>( Φ ω Φ )</h3>
                        <div style="display: flex; width: 100%;">
                            <el-button style="margin-right: 10px;" @click="() => {
                                addCondition = false
                                addConditionOption = {};
                            }">取消</el-button>
                            <el-select v-model="addConditionOption.category" placeholder="请选择类型"
                                @change="() => addConditionOption.type = undefined" style="margin-right: 10px;">
                                <el-option v-for="category in conditionCategories" :key="category" :label="category"
                                    :value="category"></el-option>
                            </el-select>
                            <el-select v-if="addConditionOption.category" v-model="addConditionOption.type"
                                placeholder="请选择属性">
                                <el-option v-for="type in categorizedConditionType[addConditionOption.category]"
                                    :key="type" :label="conditionInfoDict[type].name" :value="type"></el-option>
                            </el-select>
                            <el-select v-else disabled :modelValue="1">
                                <el-option label="-" :value="1"></el-option>
                            </el-select>
                            <el-button type="primary" style="margin-left: 10px;" @click="onAddCondition">添加</el-button>
                        </div>
                    </div>
                    <div v-else class="center add-slot">
                        <h3>/ᐠ｡ꞈ｡ᐟ\</h3>
                        <div style="width: 100%; text-align: center">
                            <el-button @click="addCondition = true">点我添加条件</el-button>
                        </div>
                    </div>
                </el-card>
            </template>
            <template v-else>
                <template v-for="(operation, seq) in customOperations" :key="seq">
                    <component
                        :is="hasOwn(OPERATION_COMPONENTS, operation.type) ? OPERATION_COMPONENTS[operation.type] : OPERATION_COMPONENTS.custom"
                        @change="ruleEdited = true" v-model="customOperations[seq]"
                        @delete="customOperations.splice(seq, 1)" />
                </template>
                <el-card>
                    <div v-if="addOperation" class="center add-slot">
                        <h3> ( Φ ω Φ ) </h3>
                        <div style="display: flex; width: 100%;">
                            <el-button style="margin-right: 10px;" @click="() => {
                                addOperation = false
                                addOperationOption = {}
                            }">取消</el-button>
                            <el-select v-if="operationCategories && operationCategories.length !== 1"
                                v-model="addOperationOption.category" placeholder="请选择分类"
                                @change="() => addOperationOption.type = undefined" style="margin-right: 10px;">
                                <el-option v-for="category in operationCategories" :key="category" :label="category"
                                    :value="category"></el-option>
                            </el-select>
                            <el-select v-if="addOperationOption.category" v-model="addOperationOption.type"
                                placeholder="请选择操作">
                                <el-option v-for="type in categorizedOperationType[addOperationOption.category]"
                                    :key="type" :label="operationInfoDict[type].name" :value="type"></el-option>
                            </el-select>
                            <el-select v-else disabled :modelValue="1">
                                <el-option label="-" :value="1"></el-option>
                            </el-select>
                            <el-button type="primary" style="margin-left: 10px;" @click="() => {
                                if (addOperationOption && addOperationOption.type) {
                                    customOperations.push({
                                        type: addOperationOption.type,
                                        direct: false,
                                        options: {}
                                    })
                                    addOperation = false
                                    addOperationOption = {}
                                    ruleEdited = true
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

.condition-group-container {
    display: flex;
    flex-direction: column;
}

.group-connector {
    margin-left: 20px;
    margin-bottom: 10px;
    margin-top: 10px;
    position: relative;
}

/* 竖线连接效果 */
.group-connector::before {
    content: '';
    position: absolute;
    left: 14px;
    /* 按钮宽度的一半左右 */
    top: -10px;
    bottom: 100%;
    width: 2px;
    background-color: var(--el-border-color);
}

.condition-group {
    border-left: 4px solid var(--el-border-color-darker);
    padding-left: 15px;
    margin-left: 10px;
    padding-top: 10px;
    padding-bottom: 10px;
    background-color: var(--el-fill-color-light);
    border-radius: 0 4px 4px 0;
    margin-bottom: 10px;
}

.condition-item-container {
    display: flex;
    flex-direction: column;
}

.item-connector {
    margin-bottom: 10px;
    margin-top: 5px;
}
</style>



<style>
.sticky-bar>div>div.el-tabs__header.is-top {
    margin-bottom: 0;
}
</style>
