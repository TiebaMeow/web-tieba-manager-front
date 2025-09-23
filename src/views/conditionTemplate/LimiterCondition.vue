<script setup lang="ts">
import NumberInput from '@/components/NumberInput.vue';
import { conditionInfoDict, type Condition, canEdit } from '@/lib/data/rule';
import CustomCard from '../../components/CustomCard.vue';

interface LimiterCondition extends Condition {
    options: {
        min?: number
        max?: number
    }
}

const data = defineModel<LimiterCondition>();
const emit = defineEmits<{
    delete: [void],
    change: [void]
}>()


</script>


<template>
    <CustomCard v-if="data" :name="conditionInfoDict[data.type].name" @delete="emit('delete')">
        <div style="display: flex;">
            <div class="number-bar">
                <p>
                    最小
                </p>
                <NumberInput v-model="data.options.min" placeholder="最小" @change="emit('change')" :disabled="!canEdit">
                </NumberInput>
            </div>
            <div class="number-bar" style="margin-left: 10px;">
                <p>
                    最大
                </p>
                <NumberInput v-model="data.options.max" placeholder="最大" @change="emit('change')" :disabled="!canEdit">
                </NumberInput>
            </div>
        </div>
    </CustomCard>
</template>


<style scoped>
.number-bar {
    width: 50%;
    display: flex;
    align-items: center;
}

.number-bar p {
    margin: 0;
    flex-shrink: 0;
    margin-right: 10px;
}
</style>
