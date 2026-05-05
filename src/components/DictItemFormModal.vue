<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { fetchDictParentOptions } from '@/api.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import {
  NModal,
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
const formRef = ref(null);

const loadingOptions = ref(false);
const parentOptions = ref([]);

// --- 表单校验规则 ---
const rules = {
  itemLabel: [
    { required: true, message: '请输入标签', trigger: 'blur' },
    { max: 50, message: '标签长度不能超过 50 个字符', trigger: 'blur' }
  ],
  itemValue: [
    { required: true, message: '请输入值', trigger: 'blur' },
    { max: 100, message: '值长度不能超过 100 个字符', trigger: 'blur' }
  ]
};

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
  formRef.value?.validate((errors) => {
    if (errors) {
      return;
    }
    const payload = { ...formData, parentId: formData.parentId || null };
    dictStore.handleSaveItem(payload);
  });
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
    <n-form ref="formRef" @submit.prevent="handleSubmit" :rules="rules">
      <n-form-item label="字典编码 (Code)">
        <n-input v-model:value="formData.dictCode" readonly disabled />
      </n-form-item>

      <n-form-item label="标签 (Label)" path="itemLabel" required>
        <n-input v-model:value="formData.itemLabel" :disabled="dictStore.itemFormModal.loading" />
      </n-form-item>

      <n-form-item label="值 (Value)" path="itemValue" required>
        <n-input v-model:value="formData.itemValue" :disabled="dictStore.itemFormModal.loading" />
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
