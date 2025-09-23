import { ref, computed } from 'vue'
import TokenRequest from '../token'
import message from '../message'
import { AxiosError } from 'axios'
import type { OperationGroup } from './operation'
import { currTokenData, SwitchTokenEvent } from './tokenManager'
import router from '@/router'


interface ConditionInfo {
    type: string
    name: string
    category: string
    description: string
    series: string,
    values: Record<string, string> | null
}

const conditionInfoList = ref<RefResponse<ConditionInfo[]>>(undefined)
async function getConditionInfoList() {
    if (!conditionInfoList.value) {
        await TokenRequest.fetch(conditionInfoList, {
            url: '/api/rule/info'
        })
    }
}
const conditionInfoDict = computed(() => {
    const dict: Record<string, ConditionInfo> = {}
    if (conditionInfoList.value) {
        conditionInfoList.value.forEach(conditionInfo => {
            dict[conditionInfo.type] = conditionInfo
        })
    }
    return dict
})
const conditionCategories = computed(() => {
    const categories: string[] = []
    if (conditionInfoList.value) {
        conditionInfoList.value.forEach((conditionInfo) => {
            if (categories.indexOf(conditionInfo.category) === -1) {
                categories.push(conditionInfo.category)
            }
        })
    }
    return categories
})
const categorizedConditionType = computed(() => {
    const data: Record<string, string[]> = {}
    if (conditionInfoList.value) {
        conditionInfoList.value.forEach(conditionInfo => {
            if (!Object.prototype.hasOwnProperty.call(data, conditionInfo.category)) {
                data[conditionInfo.category] = []
            }
            if (data[conditionInfo.category].indexOf(conditionInfo.type) === -1) {
                data[conditionInfo.category].push(conditionInfo.type)
            }
        })
    }
    return data
})

interface Condition {
    type: string
    priority?: number
    options: object
}

interface Rule {
    name: string
    manual_confirm: boolean
    last_modify: number
    whitelist: boolean
    operations: OperationGroup
    conditions: Condition[]
}


const rules = ref<RefResponse<Rule[]>>(undefined)

export const canEdit = computed(() => {
    if (!currTokenData.value) {
        return false
    }
    return currTokenData.value.permission?.can_edit_rule || currTokenData.value.system_access
})

function getRules() {
    getConditionInfoList()
    if (!rules.value) {
        TokenRequest.fetch(rules, {
            url: '/api/rule/get'
        })
    }
    return rules
}

async function fetchRules() {
    await getConditionInfoList()
    if (!rules.value) {
        await TokenRequest.fetch(rules, {
            url: '/api/rule/get'
        })
    }
    return rules
}

async function setRules() {
    if (!canEdit.value) {
        message.notify('没有权限修改规则', message.error)
        return
    }
    if (rules.value) {
        try {
            const response = await TokenRequest.post<BaseResponse<boolean>>({
                url: '/api/rule/set',
                data: rules.value
            })
            if (response.data.code === 200) {
                message.notify('规则保存成功', message.success)
            } else {
                message.notify('规则保存失败 ' + response.data.message, message.error)
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                message.notify('规则保存失败 ' + err.response?.data.message, message.error)
            } else {
                message.notify('规则保存失败 ' + err, message.error)
            }
        }
    }
}

SwitchTokenEvent.on((token) => {
    if (token && router.currentRoute.value.path.includes('rules')) {
        TokenRequest.fetch(conditionInfoList, {
            url: '/api/rule/info'
        })
        TokenRequest.fetch(rules, {
            url: '/api/rule/get'
        })
        // TODO 后续优化为不跳转
        router.push('/rules')
    } else {
        rules.value = undefined
        conditionInfoList.value = undefined
    }
})

export {
    rules,
    conditionInfoDict,
    getRules,
    fetchRules,
    setRules,
    conditionCategories,
    categorizedConditionType
}
export type {
    Condition,
    Rule
}
