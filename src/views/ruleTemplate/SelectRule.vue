<script setup lang="ts">
import { ruleInfoDict, type Rule, canEdit } from '@/lib/data/rule';
import CustomCard from '../../components/CustomCard.vue';

interface SelectRule extends Rule {
    options: {
        value: string
    }
}

const data = defineModel<SelectRule>();
const emit = defineEmits<{
    delete: [void]
    change: [void]
}>()


</script>


<template>
    <CustomCard v-if="data" :name="ruleInfoDict[data.type].name" @delete="emit('delete')">
        <div style="display: flex; flex-wrap: wrap; padding: 0 20px;">
            <el-select v-model="data.options.value" :disabled="!canEdit">
                <el-option v-for="(name, value) in ruleInfoDict[data.type].values" :key="value" :value="value"
                    :label="name" />
            </el-select>
        </div>
    </CustomCard>
</template>
