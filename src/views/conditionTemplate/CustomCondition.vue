<script setup lang="ts">
import { watchEffect, computed } from 'vue';
import { conditionInfoDict, type Condition, canEdit } from '@/lib/data/rule';
import CustomCard from '@/components/CustomCard.vue';


interface CustomCondition extends Condition {
    options: Record<string, string | number | boolean | null>
}

const data = defineModel<CustomCondition>();
const emit = defineEmits<{
    delete: [void]
    change: [void]
}>()

const optionDescs = computed(() => {
    if (!data.value) return [];
    return conditionInfoDict.value[data.value.type]?.option_descs || [];
});


watchEffect(() => {
    if (!data.value) return;
    const descs = conditionInfoDict.value[data.value.type]?.option_descs || [];
    descs.forEach(desc => {
        if (data.value && data.value.options[desc.key] === undefined) {
            data.value.options[desc.key] = desc.default as string | number | boolean;
        }
    });
});

</script>


<template>
    <CustomCard v-if="data" :name="conditionInfoDict[data.type].name" @delete="emit('delete')">
        <el-form style="margin-bottom: -18px;">
            <el-form-item v-for="desc in optionDescs" :label="desc.label" :key="desc.key">
                <el-input v-if="desc.type === 'input'" :placeholder="desc.placeholder || ''"
                    v-model="data.options[desc.key]" @change="emit('change')" :disabled="!canEdit"
                    :show-password="desc.extra?.password" :type="desc.extra?.textarea ? 'textarea' : 'text'"></el-input>
                <el-input-number v-else-if="desc.type === 'number'" :placeholder="desc.placeholder || ''"
                    v-model.number="data.options[desc.key]" @change="emit('change')"
                    :disabled="!canEdit"></el-input-number>
                <el-checkbox v-else-if="desc.type === 'checkbox'" v-model="data.options[desc.key]"
                    @change="emit('change')" :disabled="!canEdit">{{ desc.placeholder }}</el-checkbox>
            </el-form-item>
        </el-form>
    </CustomCard>
</template>
