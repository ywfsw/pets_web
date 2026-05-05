<script setup>
import { ref } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import {
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NDatePicker,
  NButton,
  NSpace,
} from 'naive-ui';

const petStore = usePetStore();
const formRef = ref(null);

// 表单校验规则
const rules = {
  weightKg: [
    { required: true, type: 'number', message: '请输入体重', trigger: 'blur' },
    { type: 'number', min: 0.1, max: 200, message: '体重应在 0.1-200 kg 之间', trigger: 'blur' }
  ],
  logDate: [
    { required: true, message: '请选择记录日期', trigger: 'change' }
  ]
};

const handleSubmit = () => {
  formRef.value?.validate((errors) => {
    if (errors) {
      return;
    }
    petStore.handleSaveWeightLog();
  });
};

const handleClose = () => {
  petStore.closeWeightLogFormModal();
};
</script>

<template>
  <n-modal
    :show="petStore.weightLogFormModal.show"
    @update:show="handleClose"
    preset="card"
    style="width: 600px;"
    :title="petStore.weightLogFormModal.isEdit ? '编辑体重记录' : '添加体重记录'"
    :bordered="false"
    :loading="petStore.weightLogFormModal.loading"
  >
    <div v-if="petStore.weightLogFormModal.data">
      <n-form ref="formRef" @submit.prevent="handleSubmit" label-placement="top" :rules="rules">
        <n-form-item label="体重 (kg)" path="weightKg" required>
          <n-input-number
            v-model:value="petStore.weightLogFormModal.data.weightKg"
            :min="0.1"
            :max="200"
            :step="0.1"
            placeholder="输入体重"
            style="width: 100%;"
            :disabled="petStore.weightLogFormModal.loading"
          />
        </n-form-item>

        <n-form-item label="记录日期" path="logDate" required>
          <n-date-picker
            v-model:value="petStore.weightLogFormModal.data.logDate"
            type="date"
            value-format="yyyy-MM-dd"
            style="width: 100%;"
            :disabled="petStore.weightLogFormModal.loading"
          />
        </n-form-item>
      </n-form>
    </div>
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="petStore.weightLogFormModal.loading">
          保存
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
