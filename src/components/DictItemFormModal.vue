<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { fetchDictParentOptions } from '@/api.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import {
  NModal,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NInputNumber,
  NButton,
  NSpace,
} from 'naive-ui';

const dictStore = useDictionaryStore();

// --- State ---
const defaultForm = () => ({
  dictCode: '', itemLabel: '', itemValue: '', parentId: null, sortOrder: 0
});
const formData = reactive(defaultForm());

const loadingOptions = ref(false);
const parentOptions = ref([]);

// --- Logic ---
watch(() => dictStore.itemFormModal.show, (newVal) => {
  if (newVal) {
    const { contextType, data, isEdit } = dictStore.itemFormModal;
    if (isEdit) {
      Object.assign(formData, data);
    } else {
      Object.assign(formData, defaultForm());
      formData.dictCode = contextType.dictCode;
    }
    loadOptions(contextType.parentCode);
  } else {
    parentOptions.value = [];
  }
});

const parentSelectOptions = computed(() =>
  parentOptions.value.map(opt => ({ label: opt.label, value: opt.id }))
);

const loadOptions = async (parentDictCode) => {
  if (!parentDictCode) {
    parentOptions.value = [];
    return;
  }
  loadingOptions.value = true;
  parentOptions.value = [];
  try {
    const response = await fetchDictParentOptions(parentDictCode);
    parentOptions.value = response.data;
  } catch (err) {
    console.error("加载父级选项失败:", err);
    window.$message.error('加载父级选项失败');
  } finally {
    loadingOptions.value = false;
  }
};

const handleSubmit = () => {
  const payload = { ...formData, parentId: formData.parentId || null };
  dictStore.handleSaveItem(payload);
};

const handleClose = () => {
  dictStore.closeDictItemModal();
};

</script>

<template>
  <n-modal
    :show="dictStore.itemFormModal.show"
    @update:show="handleClose"
    preset="card"
    style="width: 600px;"
    :title="dictStore.itemFormModal.isEdit ? '编辑字典项' : '创建新字典项'"
    :bordered="false"
    :loading="dictStore.itemFormModal.loading || loadingOptions"
  >
    <n-form @submit.prevent="handleSubmit">
      <n-form-item label="字典编码 (Code)">
        <n-input v-model:value="formData.dictCode" required readonly disabled />
      </n-form-item>

      <n-form-item label="标签 (Label)" required>
        <n-input v-model:value="formData.itemLabel" />
      </n-form-item>

      <n-form-item label="值 (Value)" required>
        <n-input v-model:value="formData.itemValue" />
      </n-form-item>

      <n-form-item label="父级 (可选)">
        <n-select
          v-model:value="formData.parentId"
          :options="parentSelectOptions"
          :loading="loadingOptions"
          :disabled="loadingOptions || !dictStore.itemFormModal.contextType?.parentCode"
          placeholder="请选择父级"
          clearable
        />
      </n-form-item>

      <n-form-item label="排序">
        <n-input-number v-model:value="formData.sortOrder" style="width: 100%;" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="dictStore.itemFormModal.loading">
          保存
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
