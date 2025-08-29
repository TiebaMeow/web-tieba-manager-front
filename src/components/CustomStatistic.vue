<script setup lang="ts">
import { ref } from 'vue';

const { value, title } = defineProps<{ value: string | number, title: string }>()

function show() {
    if (typeof value === 'number') {
        return value.toLocaleString()
    } else {
        return value
    }
}

const fakeNumber = ref(0)

</script>

<template>
    <el-statistic :value="fakeNumber" :formatter="show">
        <template #title>
            {{ title }}
        </template>
    </el-statistic>
</template>
