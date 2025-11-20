<script setup>
import { computed } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import {
  NModal,

  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDatePicker,
  NButton,
  NSpace,

} from 'naive-ui';

const petStore = usePetStore();
const dictStore = useDictionaryStore();

const eventTypeOptions = computed(() =>
  dictStore.healthEvents.map(type => ({ label: type.itemLabel, value: type.id }))
);

const handleSubmit = () => {
  petStore.handleSaveHealthEvent();
};

const handleClose = () => {
  petStore.closeHealthEventFormModal();
};
</script>

<template>
  <n-modal
    :show="petStore.healthEventFormModal.show"
    @update:show="handleClose"
    preset="card"
    style="width: 600px;"
    title="添加健康事件"
    :bordered="false"
    :loading="petStore.healthEventFormModal.loading"
  >
    <div v-if="petStore.healthEventFormModal.data">
      <n-form @submit.prevent="handleSubmit">
        <n-form-item label="事件类型" required>
          <n-select
            v-model:value="petStore.healthEventFormModal.data.eventTypeId"
            :options="eventTypeOptions"
            placeholder="请选择事件类型"
          />
        </n-form-item>

        <n-form-item label="事件日期" required>
          <n-date-picker
            v-model:value="petStore.healthEventFormModal.data.eventDate"
            type="date"
            value-format="yyyy-MM-dd"
            style="width: 100%;"
          />
        </n-form-item>

        <n-form-item label="下次提醒日期">
          <n-date-picker
            v-model:value="petStore.healthEventFormModal.data.nextDueDate"
            type="date"
            value-format="yyyy-MM-dd"
            style="width: 100%;"
          />
        </n-form-item>

        <n-form-item label="备注">
          <n-input
            v-model:value="petStore.healthEventFormModal.data.notes"
            type="textarea"
            placeholder="输入备注信息"
          />
        </n-form-item>
      </n-form>
    </div>
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="petStore.healthEventFormModal.loading">
          保存
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
