<script setup lang="ts">
import { conditionInfoDict, type Condition, canEdit } from '@/lib/data/rule';
import CustomCard from '../../components/CustomCard.vue';

interface CheckboxCondition extends Condition {
    options: {
        values: string[]
    }
}

const data = defineModel<CheckboxCondition>();
const emit = defineEmits<{
    delete: [void]
    change: [void]
}>()


</script>


<template>
    <CustomCard v-if="data" :name="conditionInfoDict[data.type].name" @delete="emit('delete')">
        <div style="display: flex; flex-wrap: wrap; padding: 0 20px;">
            <el-checkbox-group v-model="data.options.values" :disabled="!canEdit" @change="emit('change')">
                <el-checkbox v-for="(name, value) in conditionInfoDict[data.type].values" :key="value" :value="value"
                    :label="name"></el-checkbox>
            </el-checkbox-group>
        </div>
    </CustomCard>
</template>
