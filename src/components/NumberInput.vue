<script setup lang="ts">

const model = defineModel<number>()
const { defaultValue, placeholder, validatePositive = true, clearable = true, disabled = false } = defineProps<{
    defaultValue?: number,
    placeholder?: string,
    validatePositive?: boolean,
    clearable?: boolean,
    disabled?: boolean
}>()

const cache = ref('')

const showModel = computed({
    get() {
        return cache.value ? cache.value : model.value === defaultValue ? undefined : model.value
    },
    set(param: string) {
        cache.value = param
    }
})

function sync(param: string) {
    model.value = parse(param)
    cache.value = ''
}

function parse(param: string) {
    const num = parseFloat(param)
    if (!isNaN(num)) {
        if (validatePositive && num < 0) {
            return defaultValue
        } else {
            return num
        }
    } else {
        return defaultValue
    }
}
</script>

<template>
    <el-input v-model="showModel" @change="sync" :clearable="clearable" @clear="model = defaultValue; cache = ''"
        :placeholder="placeholder || (defaultValue ? defaultValue.toString() : '')" :disabled="disabled" />
</template>

<style scoped></style>
