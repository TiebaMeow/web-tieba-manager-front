<script setup lang="ts">
import { CUSTOM_OPERATION_OPTIONS, type Operation } from '@/lib/data/operation';
import CustomCard from '../../components/CustomCard.vue';

interface CustomBlock extends Operation {
    type: 'block'
    options: {
        day?: number
        reason?: string
    }
}
const data = defineModel<CustomBlock>();
const emit = defineEmits<{
    delete: [void],
    change: [void]
}>()


</script>


<template>
    <CustomCard v-if="data" :name="CUSTOM_OPERATION_OPTIONS.block" @delete="emit('delete')">
        <el-form label-width="auto">
            <el-form-item label="天数">
                <el-input-number v-model="data.options.day" placeholder="默认为设置天数" :min="1" style="width:200px;"></el-input-number>
            </el-form-item>
            <el-form-item label="理由">
                <el-input v-model="data.options.reason" clearable placeholder="默认为设置理由"></el-input>
            </el-form-item>
        </el-form>
    </CustomCard>
</template>
