<script setup lang="ts">
import { CUSTOM_OPERATION_OPTIONS, type Operation } from '@/lib/data/operation';
import CustomCard from '../../components/CustomCard.vue';
import { canEdit } from '@/lib/data/rule';

interface CustomDelete extends Operation {
    options: {
        delete_thread_if_author?: boolean
    }
}

const data = defineModel<CustomDelete>();
const emit = defineEmits<{
    delete: [void],
    change: [void]
}>()


</script>


<template>
    <CustomCard v-if="data" :name="CUSTOM_OPERATION_OPTIONS.delete" @delete="emit('delete')">
        <el-checkbox v-model="data.options.delete_thread_if_author" style="margin-left: 20px;" @change="emit('change')"
            :disabled="!canEdit">如果是楼主，则删除主题帖</el-checkbox>
    </CustomCard>
</template>
