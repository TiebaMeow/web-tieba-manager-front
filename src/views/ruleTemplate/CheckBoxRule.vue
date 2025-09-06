<script setup lang="ts">
import { ruleInfoDict, type Rule } from '@/lib/data/rule';
import CustomCard from '../../components/CustomCard.vue';

interface CheckboxRule extends Rule {
    options: {
        values: string[]
    }
}

const data = defineModel<CheckboxRule>();
const emit = defineEmits<{
    delete: [void]
    change: [void]
}>()


</script>


<template>
    <CustomCard v-if="data" :name="ruleInfoDict[data.type].name" @delete="emit('delete')">
        <div style="display: flex; flex-wrap: wrap; padding: 0 20px;">
            <el-checkbox-group v-model="data.options.values">
                <el-checkbox v-for="(name, value) in ruleInfoDict[data.type].values" :key="value" :value="value"
                    :label="name"></el-checkbox>
            </el-checkbox-group>
        </div>
    </CustomCard>
</template>
