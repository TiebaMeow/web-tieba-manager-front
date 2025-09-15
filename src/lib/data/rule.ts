import { ref, computed } from 'vue'
import TokenRequest from '../token'
import message from '../message'
import { AxiosError } from 'axios'
import type { OperationGroup } from './operation'
import { currTokenData, SwitchTokenEvent } from './tokenManager'
import router from '@/router'


interface RuleInfo {
    type: string
    name: string
    category: string
    description: string
    series: string,
    values: Record<string, string> | null
}

const ruleInfoList = ref<RefResponse<RuleInfo[]>>(undefined)
async function getRuleInfoList() {
    if (!ruleInfoList.value) {
        await TokenRequest.fetch(ruleInfoList, {
            url: '/api/rule/info'
        })
    }
}
const ruleInfoDict = computed(() => {
    const dict: Record<string, RuleInfo> = {}
    if (ruleInfoList.value) {
        ruleInfoList.value.forEach(ruleInfo => {
            dict[ruleInfo.type] = ruleInfo
        })
    }
    return dict
})
const ruleCategories = computed(() => {
    const categories: string[] = []
    if (ruleInfoList.value) {
        ruleInfoList.value.forEach((ruleInfo) => {
            if (categories.indexOf(ruleInfo.category) === -1) {
                categories.push(ruleInfo.category)
            }
        })
    }
    return categories
})
const categorizedRuleType = computed(() => {
    const data: Record<string, string[]> = {}
    if (ruleInfoList.value) {
        ruleInfoList.value.forEach(ruleInfo => {
            if (!Object.prototype.hasOwnProperty.call(data, ruleInfo.category)) {
                data[ruleInfo.category] = []
            }
            if (data[ruleInfo.category].indexOf(ruleInfo.type) === -1) {
                data[ruleInfo.category].push(ruleInfo.type)
            }
        })
    }
    return data
})

interface Rule {
    type: string
    priority?: number
    options: object
}

interface RuleSet {
    name: string
    manual_confirm: boolean
    last_modify: number
    whitelist: boolean
    operations: OperationGroup
    rules: Rule[]
}


const ruleSets = ref<RefResponse<RuleSet[]>>(undefined)

export const canEdit = computed(() => {
    return currTokenData.value.permission?.can_edit_rule_set || currTokenData.value.system_access
})

function getRuleSets() {
    getRuleInfoList()
    if (!ruleSets.value) {
        TokenRequest.fetch(ruleSets, {
            url: '/api/rule/get'
        })
    }
    return ruleSets
}

async function fetchRuleSets() {
    await getRuleInfoList()
    if (!ruleSets.value) {
        await TokenRequest.fetch(ruleSets, {
            url: '/api/rule/get'
        })
    }
    return ruleSets
}

async function setRuleSets() {
    if (!canEdit.value) {
        message.notify('没有权限修改规则', message.error)
        return
    }
    if (ruleSets.value) {
        try {
            const response = await TokenRequest.post<BaseResponse<boolean>>({
                url: '/api/rule/set',
                data: ruleSets.value
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
    if (token && router.currentRoute.value.path.includes('rule-sets')) {
        TokenRequest.fetch(ruleInfoList, {
            url: '/api/rule/info'
        })
        TokenRequest.fetch(ruleSets, {
            url: '/api/rule/get'
        })
        // TODO 后续优化为不跳转
        router.push('/rule-sets')
    } else {
        ruleSets.value = undefined
        ruleInfoList.value = undefined
    }
})

export {
    ruleSets,
    ruleInfoDict,
    getRuleSets,
    fetchRuleSets,
    setRuleSets,
    ruleCategories,
    categorizedRuleType
}
export type {
    Rule,
    RuleSet
}
