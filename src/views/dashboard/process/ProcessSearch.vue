<script setup lang="ts">
import ProcessCard from './ProcessCard.vue';

const { searchResult } = defineProps<{
    searchResult: RefResponse<{
        page: {
            total: number,
            page_count: number
        },
        data: Array<{
            result_rule: string
            is_whitelist: boolean
            process_time: number
            content: Content
        }>
    }>
}>();
</script>



<template>
    <div v-if="searchResult === null" class="text-result-container">
        <h2>正在加载搜索结果...</h2>
    </div>
    <div v-else-if="searchResult === false" class="text-result-container">
        <h2>加载搜索结果时出错。</h2>
    </div>
    <div v-else-if="searchResult">
        <div v-if="searchResult.data.length === 0" class="text-result-container">
            <h2>未找到相关处理记录。</h2>
        </div>
        <div v-else>
            <ProcessCard v-for="item in searchResult.data" :key="item.content.pid" :result_rule="item.result_rule"
                :is_whitelist="item.is_whitelist" :process_time="item.process_time" :content="item.content" />
        </div>
    </div>
</template>

<style scoped>
.text-result-container {
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
