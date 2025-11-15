<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import TokenRequest from '@/lib/token';
import { formatDate, getContentMark, gotoPortrait } from '@/lib/utils';


const router = useRouter();

const {
    content,
    result_rule,
    process_time,
} = defineProps<{
    content: Content;
    result_rule: string;
    process_time: number;
}>();

const firstImage = computed(() => {
    if (content.images && content.images.length > 0) {
        return content.images[0];
    }
    return null;
});

const imageRatio = computed(() => {
    if (firstImage.value) {
        return firstImage.value.width / firstImage.value.height;
    }
    return 1;
});

function goToDetail() {
    router.push('/process/detail/' + content.pid);
}

const MAX_PREVIEW_LENGTH = 40;

function truncateText(text: string, maxLen: number = MAX_PREVIEW_LENGTH) {
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}


</script>

<template>
    <el-card style="margin-bottom: 20px;" @click="goToDetail">
        <div class="head">
            <div class="avatar-container" @click.stop="gotoPortrait(content.user.portrait)">
                <img :src="TokenRequest.host + '/resources/portrait/' + content.user.portrait" alt="头像"
                    loading="lazy" />
            </div>
            <div style="display: flex;flex: 1 0 auto;flex-direction: column">
                <span>{{ content.user.nick_name }} {{ content.user.level }}级</span>
                <span style="color: grey">{{ formatDate(content.create_time) }}</span>
            </div>
            <div style="display: flex; flex-grow: 1; justify-content: flex-end">
                <el-tag type="primary" style="margin-right: 10px;">{{ formatDate(process_time) }}</el-tag>
                <el-tag type="primary" style="margin-right: 10px;">{{ result_rule }}</el-tag>
            </div>
        </div>
        <div class="body">
            <div style="flex-grow: 1;">
                <h3 style="margin: 0; margin-bottom: 10px;">{{ content.title || getContentMark(content) }}</h3>
                <p v-if="content.text" style="margin: 0; word-break: break-all;">
                    <template v-for="(line, index) in truncateText(content.text).split('\n')" :key="index">
                        {{ line }}<br />
                    </template>
                </p>
            </div>
            <div v-if="firstImage"
                style="width: 60px; height: 60px; display: flex; justify-content: center; align-items: center; overflow: hidden; flex-shrink: 0; margin-left: 30px;">
                <img v-if="imageRatio > 1" :src="`${TokenRequest.host}/resources/image/${firstImage.hash}`"
                    alt="content image" style="height: 60px; border-radius: 5px;" />
                <img v-else :src="`${TokenRequest.host}/resources/image/${firstImage.hash}`" alt="content image"
                    style="width: 60px; border-radius: 5px;" />
            </div>
        </div>
    </el-card>
</template>


<style scoped>
.head {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.body {
    width: 100%;
    display: flex
}

.avatar-container {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    background: black;
    margin-right: 10px;
    overflow: hidden;
}

.avatar-container img {
    width: 100%;
    height: 100%;
}

.image-container {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
}

.image-container img {
    height: 110px;
    margin: 0 10px 10px 0;
}

/* 整卡可点击样式、hover 与 选中样式 */
.el-card {
    cursor: pointer;
    transition: box-shadow .18s ease, transform .12s ease, border-color .12s ease, background-color .12s ease;
}

.el-card:hover {
    /* transform: translateY(-3px); */
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
}
</style>
