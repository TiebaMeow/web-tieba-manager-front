<script setup lang="ts">
import { ruleInfoDict, type Rule } from '@/lib/data/rule';
import CustomCard from '../../components/CustomCard.vue';

interface TextRule extends Rule {
    options: {
        text?: string
        is_regex?: boolean
        ignore_case?: boolean
    }
}

const data = defineModel<TextRule>();
const emit = defineEmits<{
    delete: [void]
    change: [void]
}>()


</script>


<template>
    <CustomCard v-if="data" :name="ruleInfoDict[data.type].name" @delete="emit('delete')">
        <div style="margin-bottom: 10px; display: flex; flex-grow: 1;">
            <div style="flex-grow: 1; padding: 0 20px;">
                <el-checkbox v-model="data.options.is_regex" style="margin-right: 50px;"
                    @change="emit('change')">正则</el-checkbox>
                <el-checkbox v-model="data.options.ignore_case" @change="emit('change')">忽略大小写</el-checkbox>
            </div>
        </div>
        <el-input autosize type="textarea" style="flex-grow: 1;" v-model="data.options.text" @change="emit('change')"
            placeholder="请输入文本"></el-input>
    </CustomCard>
</template>
