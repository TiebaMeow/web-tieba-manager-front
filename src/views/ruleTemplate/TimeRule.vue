<script setup lang="ts">
import { MAIN_VIEW } from '@/lib/constance';
import { ruleInfoDict, type Rule, canEdit } from '@/lib/data/rule';
import CustomCard from '../../components/CustomCard.vue';

interface LimiterRule extends Rule {
    options: {
        start?: string
        end?: string
    }
}

const data = defineModel<LimiterRule>();
const emit = defineEmits<{
    delete: [void],
    change: [void]
}>()


</script>


<template>
    <CustomCard v-if="data" :name="ruleInfoDict[data.type].name" @delete="emit('delete')">
        <div style="display: flex; flex-wrap: wrap;">
            <div class="bar" :class="{ [MAIN_VIEW]: true }">
                <p>
                    起始
                </p>
                <el-date-picker v-model="data.options.start" type="datetime" placeholder="选填"
                    value-format="YYYY-MM-DD HH:mm:ss" :disabled="!canEdit" />
            </div>
            <div class="bar">
                <p>
                    结束
                </p>
                <el-date-picker v-model="data.options.end" type="datetime" placeholder="选填"
                    value-format="YYYY-MM-DD HH:mm:ss" :disabled="!canEdit" />
            </div>
        </div>
    </CustomCard>
</template>


<style scoped>
.delete-button {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-shrink: 0;
    cursor: pointer;

}

.bar {
    flex-grow: 1;
    display: flex;
    align-items: center;
}

.desktop {
    width: 50%;
}

.mobile {
    width: 100%;
    margin-bottom: 10px;
}

.bar p {
    margin: 0;
    flex-shrink: 0;
    margin-right: 10px;
}
</style>
