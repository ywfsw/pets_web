<script setup>
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

const handleSubmit = () => {
  petStore.handleSaveWeightLog();
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
    title="添加体重记录"
    :bordered="false"
    :loading="petStore.weightLogFormModal.loading"
  >
    <div v-if="petStore.weightLogFormModal.data">
      <n-form @submit.prevent="handleSubmit">
        <n-form-item label="体重 (kg)" required>
          <n-input-number
            v-model:value="petStore.weightLogFormModal.data.weightKg"
            :min="0.1"
            :max="200"
            :step="0.1"
            placeholder="输入体重"
            style="width: 100%;"
          />
        </n-form-item>

        <n-form-item label="记录日期" required>
          <n-date-picker
            v-model:value="petStore.weightLogFormModal.data.logDate"
            type="date"
            value-format="yyyy-MM-dd"
            style="width: 100%;"
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
