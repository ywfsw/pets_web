<script setup>
import { ref } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NDatePicker,
  NButton,
  NSpace,
  useMessage,
} from 'naive-ui';

const petStore = usePetStore();
const message = useMessage();
const formRef = ref(null);

const rules = {
  feedTime: [
    { required: true, message: '请选择喂食时间', trigger: 'change' }
  ],
  foodType: [
    { required: true, message: '请输入食物类型', trigger: 'blur' },
    { max: 100, message: '食物类型最多 100 字', trigger: 'blur' }
  ]
};

const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return;
    try {
      await petStore.handleSaveFeedingRecord();
      message.success(petStore.feedingRecordFormModal.isEdit ? '喂养记录已更新' : '喂养记录已添加');
    } catch {
      message.error('保存喂养记录失败，请重试');
    }
  });
};

const handleClose = () => {
  petStore.closeFeedingRecordFormModal();
};
</script>

<template>
  <n-modal
    :show="petStore.feedingRecordFormModal.show"
    @update:show="handleClose"
    preset="card"
    style="width: 500px;"
    :title="petStore.feedingRecordFormModal.isEdit ? '编辑喂养记录' : '添加喂养记录'"
    :bordered="false"
    :loading="petStore.feedingRecordFormModal.loading"
  >
    <div v-if="petStore.feedingRecordFormModal.data">
      <n-form ref="formRef" @submit.prevent="handleSubmit" label-placement="top" :rules="rules">
        <n-form-item label="喂食时间" path="feedTime" required>
          <n-date-picker
            v-model:value="petStore.feedingRecordFormModal.data.feedTime"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm"
            style="width: 100%;"
            :disabled="petStore.feedingRecordFormModal.loading"
          />
        </n-form-item>

        <n-form-item label="食物类型" path="foodType" required>
          <n-input
            v-model:value="petStore.feedingRecordFormModal.data.foodType"
            placeholder="如：猫粮、罐头、冻干、鸡胸肉..."
            maxlength="100"
            :disabled="petStore.feedingRecordFormModal.loading"
          />
        </n-form-item>

        <n-form-item label="食量 (克)" path="amountGrams">
          <n-input-number
            v-model:value="petStore.feedingRecordFormModal.data.amountGrams"
            :min="1"
            :max="10000"
            placeholder="输入食量（可选）"
            style="width: 100%;"
            :disabled="petStore.feedingRecordFormModal.loading"
          />
        </n-form-item>

        <n-form-item label="备注" path="notes">
          <n-input
            v-model:value="petStore.feedingRecordFormModal.data.notes"
            type="textarea"
            placeholder="如：食欲很好、换了新粮..."
            :rows="2"
            maxlength="500"
            :disabled="petStore.feedingRecordFormModal.loading"
          />
        </n-form-item>
      </n-form>
    </div>
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="petStore.feedingRecordFormModal.loading">
          保存
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
