<script setup lang="ts">
import { getData } from '@/lib/utils';
import CollapseItem from '@/components/CollapseItem';
import { useRoute, useRouter } from 'vue-router';
import { DashboardRoutes } from '@/router';
import { getViewMode } from '@/lib/utils';
import { getHomeInfo } from '@/lib/data/common';
import { historyHosts } from '@/lib/data/hostManager';
import TokenRequest from '@/lib/token';

const route = useRoute()
const router = useRouter()
const ifShow = defineModel<boolean>()
const viewMode = getViewMode(900)
const homeInfo = getHomeInfo()


function getHost() {
    const host = getData<string>('server_host')
    return host ? host.replace(/https?:\/\//, '') : 'localhost' // 去掉协议头，只保留域名或IP
}

function goto(url: string) {
    router.push(url)
    if (viewMode === 'mobile' && ifShow.value) {
        ifShow.value = false
    }
}

const visibleRoutes = DashboardRoutes.filter((value) => !value.meta.hide)

</script>

<template>
    <div class="container" :style="{ position: viewMode === 'mobile' ? 'absolute' : 'relative' }">
        <CollapseItem row>
            <div v-show="ifShow">
                <div class="sidebar-placeholder">

                </div>
                <div class="sidebar">
                    <div class="title">
                        {{ getHost() }}<br />
                        {{ historyHosts[TokenRequest.host].user }}<template v-if="homeInfo && homeInfo.forum">@{{
                            homeInfo.forum }}</template>
                    </div>
                    <div v-for="routeRaw in visibleRoutes" :key="routeRaw.name" class="bar"
                        :class="route.path === routeRaw.path ? 'bar-active' : 'bar-inactive'"
                        @click="goto(routeRaw.path)">
                        {{ routeRaw.meta.title }}
                    </div>
                </div>
            </div>
        </CollapseItem>

    </div>
</template>

<style scoped>
.container {
    left: 0;
    z-index: 100;
    background: white;
}

.sidebar-placeholder {
    width: 250px;
    height: calc(100vh - 50px);
    position: relative;
}


.sidebar {
    width: max-content;
    min-width: 250px;
    height: calc(100vh - 50px);
    border-right: 1px solid var(--bolder-color);
    position: absolute;
    top: 0;
    right: 0;
}

.title {
    width: 250px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 5px 0;
    border-bottom: 1px solid var(--bolder-color);
    font-size: 20px;
    word-break: break-all;

}

.bar {
    height: 20px;
    padding: 10px 20px;
    margin: 15px 10px;
    margin-right: 0;
    user-select: none;
    border-radius: 20px 0 0 20px;
}

.bar-inactive:hover {
    background-color: rgb(226, 248, 248);
    cursor: pointer;
    /* padding: 9px; */
}

.bar-active {
    padding: 9px 19px;
    background-color: rgb(208, 252, 252);
    border: 1px solid rgb(167, 203, 233);
    border-right: none;
}
</style>
