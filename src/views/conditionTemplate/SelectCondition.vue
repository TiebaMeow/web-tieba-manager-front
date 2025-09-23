<script setup lang="ts">
import { conditionInfoDict, type Condition, canEdit } from '@/lib/data/rule';
import CustomCard from '../../components/CustomCard.vue';

interface SelectCondition extends Condition {
    options: {
        value: string
    }
}

const data = defineModel<SelectCondition>();
const emit = defineEmits<{
    delete: [void]
    change: [void]
}>()


</script>


<template>
    <CustomCard v-if="data" :name="conditionInfoDict[data.type].name" @delete="emit('delete')">
        <div style="display: flex; flex-wrap: wrap; padding: 0 20px;">
            <el-select v-model="data.options.value" :disabled="!canEdit" @change="emit('change')">
                <el-option v-for="(name, value) in conditionInfoDict[data.type].values" :key="value" :value="value"
                    :label="name" />
            </el-select>
        </div>
    </CustomCard>
</template>
