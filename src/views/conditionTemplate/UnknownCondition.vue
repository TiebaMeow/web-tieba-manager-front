<script setup lang="ts">
import { type Condition } from '@/lib/data/rule';
import CustomCard from '../../components/CustomCard.vue';

const data = defineModel<Condition>();
const emit = defineEmits<{
    delete: [void]
    change: [void]
}>()

</script>


<template>
    <CustomCard v-if="data" :name="'未知条件 (' + data.type + ')'" @delete="emit('delete')">
        <p>无法识别的条件系列（series），以下为原始条件数据：</p>
        <pre
            style="white-space: pre-wrap; word-break: break-word; background:#f5f7fa;padding:10px;border-radius:4px;">{{ JSON.stringify(data, null, 2) }}</pre>
    </CustomCard>
</template>
