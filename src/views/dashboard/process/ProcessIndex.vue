<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TokenRequest from '@/lib/token';

import ProcessSearch from './ProcessSearch.vue';

import type { FormInstance, FormRules } from 'element-plus';

const PAGE_SIZE = 10;

const route = useRoute();
const router = useRouter();

const searchFormRef = ref<FormInstance>();

const overview = ref<RefResponse<{
    total: {
        all: number;
        hit: number;
        whitelist: number;
    };
    hit_rules: Record<string, number>;
    whitelist_rules: Record<string, number>;
    hint_rules: Array<string>;
}>>(null);

TokenRequest.fetch(overview, {
    url: '/api/process/overview',
})

const searchResult = ref<RefResponse<{
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
}>>(null);
const currPage = ref(1);


function fetchRecentHits(page: number = 1) {
    currPage.value = page;
    TokenRequest.fetch(searchResult, {
        url: '/api/process/search',
        data: {
            page,
            page_size: PAGE_SIZE,
            params: [{
                type: 'hit',
            }]
        }
    }, 'post')
}
if (route.name === 'processIndex') {
    fetchRecentHits();
}

const searchTypeDict = {
    rule: '规则',
    tid: '主题帖ID',
    pid: '回复ID',
    text: '模糊搜索'
}

const searchParams = ref<Array<SearchParams>>([{
    type: 'rule',
    param: '',
}]);

interface SearchParams {
    type: 'rule' | 'tid' | 'pid' | 'text';
    param: string;
}

const paramVerify = {
    rule: (param: string) => !!param,
    tid: (param: string) => /^\d+$/.test(param),
    pid: (param: string) => /^\d+$/.test(param),
    text: (param: string) => param.length > 0,
}

const validateParam = (rule: { field?: string }, value: string | undefined, callback: (error?: Error) => void) => {
    if (!rule.field) {
        return callback(new Error('未知字段'));
    }
    const index = parseInt(rule.field.split('.')[0]);
    const searchItem = searchParams.value[index];
    if (!paramVerify[searchItem.type](searchItem.param)) {
        let errorMsg = '请输入搜索内容';
        if (searchItem.type === 'tid' || searchItem.type === 'pid') {
            errorMsg = '请输入合法的ID';
        } else if (searchItem.type === 'rule') {
            errorMsg = '请选择规则';
        }
        return callback(new Error(errorMsg));
    }
    callback();
};

const rules = reactive<FormRules>({
    param: [{ validator: validateParam, trigger: 'blur' }]
});


async function search(page: number = 1) {
    if (!searchFormRef.value) return;
    await searchFormRef.value.validate((valid) => {
        currPage.value = page;
        if (valid) {
            TokenRequest.fetch(searchResult, {
                url: '/api/process/search',
                data: {
                    params: searchParams.value.map(param => ({
                        type: param.type,
                        param: param.param,
                    })),
                    page,
                    page_size: PAGE_SIZE,
                }
            }, 'post')
            if (route.name !== 'processSearch') {
                router.push({
                    name: 'processSearch',
                })
            }
        }
    })
}

async function goBack() {
    if (route.name === 'processIndex') return
    else if (route.name === 'processSearch') {
        searchParams.value = [{ type: 'rule', param: '' }];
        searchFormRef.value?.resetFields();
        router.push({
            name: 'processIndex',
        })
        fetchRecentHits();
    } else if (route.name === 'processDetail') {
        await searchFormRef.value?.validate((valid) => {
            if (valid) {
                search();
            } else {
                router.push({
                    name: 'processIndex',
                })
                searchFormRef.value?.resetFields();
                fetchRecentHits();
            }
        });
    }
}

function handlePageChange(page: number) {
    if (route.name === 'processIndex') {
        fetchRecentHits(page);
    } else {
        search(page);
    }
}


</script>

<template>
    <div style="max-width: 1000px; position: relative;flex-grow: 1;">
        <div style="max-width: 600px; flex-grow: 1;" v-if="overview">
            <el-form :model="searchParams" ref="searchFormRef" style="margin-bottom: 30px;">
                <div v-for="(param, index) in searchParams" :key="index" style="display: flex; flex-grow: 1;">
                    <el-form-item :prop="`${index}.type`" style="margin-right: 10px; width:100px; margin-bottom: 0;">
                        <el-select v-model="param.type" placeholder="搜索类型">
                            <el-option v-for="(label, value) in searchTypeDict" :key="value" :label="label"
                                :value="value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :prop="`${index}.param`" :rules="rules.param" style="flex-grow: 1; margin-bottom: 0;">
                        <el-select v-if="param.type === 'rule'" v-model="param.param" placeholder="请选择规则"
                            style="width: 100%;" filterable>
                            <el-option v-for="rule in overview.hint_rules" :key="rule" :label="rule" :value="rule" />
                        </el-select>
                        <el-input v-else v-model="param.param" placeholder="请输入搜索内容" @keydown.enter="search(1)" />
                    </el-form-item>
                    <el-form-item style="margin-left: 10px; margin-bottom: 0;">
                        <el-button type="primary" @click="search(1)">搜索</el-button>
                        <el-button v-if="route.name !== 'processIndex'" @click="goBack" type="primary">返回</el-button>
                    </el-form-item>
                </div>
            </el-form>
            <template v-if="['processIndex', 'processSearch'].includes(route.name as string)">
                <div v-if="route.name === 'processIndex'" style="display: flex; margin-bottom: 20px">
                    <div style="margin-right: 30px" class="statistic-card">
                        <el-statistic title="24小时处理数" :value="overview.total.all" />
                    </div>
                    <div class="statistic-card">
                        <el-statistic title="命中规则数" :value="overview.total.hit" />
                    </div>
                </div>
                <div class="center">
                    <el-pagination v-if="searchResult && searchResult.page.page_count > 1" style="margin-bottom: 20px;"
                        :current-page="currPage" :page-count="searchResult.page.page_count" layout="prev, pager, next"
                        @current-change="handlePageChange" />
                </div>
                <ProcessSearch :searchResult="searchResult" />
                <div class="center">
                    <el-pagination v-if="searchResult && searchResult.page.page_count > 1" style="margin-bottom: 20px;"
                        :current-page="currPage" :page-count="searchResult.page.page_count" layout="prev, pager, next"
                        @current-change="handlePageChange" />
                </div>
                <div style="width: 100%; height: 100px">
                    <!-- placeholder  -->
                </div>
            </template>
            <template v-else>
                <el-divider />
                <router-view />
            </template>

        </div>
    </div>
</template>


<style scoped>
.statistic-card {
    padding: 5px 10px;
}
</style>
