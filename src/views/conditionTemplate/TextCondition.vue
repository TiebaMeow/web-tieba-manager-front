<script setup lang="ts">
import { conditionInfoDict, type Condition, canEdit } from '@/lib/data/rule';
import CustomCard from '../../components/CustomCard.vue';

interface TextCondition extends Condition {
    options: {
        text?: string
        is_regex?: boolean
        ignore_case?: boolean
    }
}

const data = defineModel<TextCondition>();
const emit = defineEmits<{
    delete: [void]
    change: [void]
}>()


</script>


<template>
    <CustomCard v-if="data" :name="conditionInfoDict[data.type].name" @delete="emit('delete')">
        <div style="margin-bottom: 10px; display: flex; flex-grow: 1;">
            <div style="flex-grow: 1; padding: 0 20px;">
                <el-checkbox v-model="data.options.is_regex" style="margin-right: 50px;" :disabled="!canEdit"
                    @change="emit('change')">正则</el-checkbox>
                <el-checkbox v-model="data.options.ignore_case" @change="emit('change')"
                    :disabled="!canEdit">忽略大小写</el-checkbox>
            </div>
        </div>
        <el-input autosize type="textarea" style="flex-grow: 1;" v-model="data.options.text" @change="emit('change')"
            placeholder="请输入文本" :disabled="!canEdit"></el-input>
    </CustomCard>
</template>
