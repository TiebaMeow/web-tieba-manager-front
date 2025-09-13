<script setup lang="ts">
import { Close } from '@element-plus/icons-vue';
import { canEdit } from '@/lib/data/rule';

const {
    name = ''
} = defineProps<{
    name: string
}>()

const emit = defineEmits<{
    delete: [void]
}>()
</script>

<template>
    <el-card style="margin-bottom: 20px;">
        <div class="container" :class="{ 'with-slot': $slots.default }">
            <div class="center header">
                <slot v-if="$slots.name" name="name"> </slot>
                <b v-else>
                    {{ name }}
                </b>
            </div>
            <div style="flex-grow: 1;">
            </div>
            <el-button v-if="canEdit" type="danger" :icon="Close" @click="emit('delete')"
                style="margin-left: 10px; width: 35px; flex-shrink: 0;">
            </el-button>
        </div>
        <div v-if="$slots.default">
            <slot></slot>
        </div>
    </el-card>
</template>

<style scoped>
.container {
    display: flex;
    width: 100%;
    padding-bottom: 10px;
    margin-bottom: 15px;
}

.with-slot {
    border-bottom: 1px solid lightgray;
    margin-bottom: 15px;
}


.header {
    flex-shrink: 0;
    width: 80px;
    align-items: center;
}
</style>
