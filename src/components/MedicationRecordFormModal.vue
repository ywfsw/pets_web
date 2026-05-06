<script setup>
import { ref } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDatePicker,
  NButton,
  useMessage,
} from 'naive-ui';

const petStore = usePetStore();
const message = useMessage();
const formRef = ref(null);

const medicationTypeOptions = [
  { label: '口服药', value: '口服药' },
  { label: '外用药', value: '外用药' },
  { label: '注射药', value: '注射药' },
  { label: '滴剂', value: '滴剂' },
  { label: '喷雾', value: '喷雾' },
  { label: '眼药', value: '眼药' },
  { label: '耳药', value: '耳药' },
  { label: '保健品', value: '保健品' },
  { label: '中草药', value: '中草药' }
];

const frequencyOptions = [
  { label: '每日一次', value: '每日一次' },
  { label: '每日两次', value: '每日两次' },
  { label: '每日三次', value: '每日三次' },
  { label: '每周一次', value: '每周一次' },
  { label: '按需使用', value: '按需使用' },
  { label: '一次性', value: '一次性' }
];

const rules = {
  medicationName: [
    { required: true, message: '请输入药物名称', trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ]
};

const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return;
    try {
      await petStore.handleSaveMedicationRecord();
      message.success(petStore.medicationRecordFormModal.isEdit ? '记录已更新' : '记录已添加');
    } catch {
      message.error('保存用药记录失败，请重试');
    }
  });
};

const handleClose = () => {
  petStore.closeMedicationRecordFormModal();
};
</script>

<template>
  <n-modal
    :show="petStore.medicationRecordFormModal.show"
    @update:show="handleClose"
    :bordered="false"
    :mask-closable="false"
    class="medication-form-modal-wrap"
    transform-origin="center"
  >
    <div class="form-glass-card form-glass-card--medication">
      <!-- 浮动装饰 -->
      <div class="form-decor form-decor-1">💊</div>
      <div class="form-decor form-decor-2">✨</div>
      <div class="form-decor form-decor-3">💉</div>
      <div class="form-decor form-decor-4">🩺</div>

      <!-- 关闭按钮 -->
      <button class="form-close-btn" @click="handleClose" aria-label="关闭">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <!-- 头部 -->
      <div class="form-header">
        <div class="form-header-icon form-header-icon--medication">
          <span style="font-size: 28px;">💊</span>
        </div>
        <h2 class="form-title form-title--medication">{{ petStore.medicationRecordFormModal.isEdit ? '编辑用药记录' : '记录用药' }}</h2>
        <p class="form-subtitle">{{ petStore.medicationRecordFormModal.isEdit ? '更新用药信息' : '记录宠物用药情况 🐾' }}</p>
      </div>

      <!-- 表单内容 -->
      <div v-if="petStore.medicationRecordFormModal.data" class="form-body">
        <n-form ref="formRef" @submit.prevent="handleSubmit" label-placement="top" :rules="rules">
          <n-form-item label="药物名称" path="medicationName" required :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input
              v-model:value="petStore.medicationRecordFormModal.data.medicationName"
              placeholder="如：阿莫西林、体外驱虫滴剂..."
              size="large"
              :disabled="petStore.medicationRecordFormModal.loading"
            />
          </n-form-item>

          <div class="form-row">
            <div class="form-row-item">
              <n-form-item label="药物类型" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
                <n-select
                  v-model:value="petStore.medicationRecordFormModal.data.medicationType"
                  :options="medicationTypeOptions"
                  placeholder="选择类型"
                  size="large"
                  clearable
                  :disabled="petStore.medicationRecordFormModal.loading"
                />
              </n-form-item>
            </div>
            <div class="form-row-item">
              <n-form-item label="用药频率" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
                <n-select
                  v-model:value="petStore.medicationRecordFormModal.data.frequency"
                  :options="frequencyOptions"
                  placeholder="选择频率"
                  size="large"
                  clearable
                  :disabled="petStore.medicationRecordFormModal.loading"
                />
              </n-form-item>
            </div>
          </div>

          <n-form-item label="剂量" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input
              v-model:value="petStore.medicationRecordFormModal.data.dosage"
              placeholder="如：1片/次、0.5ml/次..."
              size="large"
              :disabled="petStore.medicationRecordFormModal.loading"
            />
          </n-form-item>

          <div class="form-row">
            <div class="form-row-item">
              <n-form-item label="开始日期" path="startDate" required :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
                <n-date-picker
                  v-model:value="petStore.medicationRecordFormModal.data.startDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  style="width: 100%;"
                  size="large"
                  :disabled="petStore.medicationRecordFormModal.loading"
                />
              </n-form-item>
            </div>
            <div class="form-row-item">
              <n-form-item label="结束日期" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
                <n-date-picker
                  v-model:value="petStore.medicationRecordFormModal.data.endDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  style="width: 100%;"
                  size="large"
                  clearable
                  :disabled="petStore.medicationRecordFormModal.loading"
                />
              </n-form-item>
            </div>
          </div>

          <n-form-item label="备注" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input
              v-model:value="petStore.medicationRecordFormModal.data.notes"
              type="textarea"
              placeholder="如：饭后服用、注意事项、副作用..."
              :rows="3"
              size="large"
              :maxlength="500"
              show-count
              :disabled="petStore.medicationRecordFormModal.loading"
            />
          </n-form-item>
        </n-form>
      </div>

      <!-- 底部按钮 -->
      <div class="form-footer">
        <n-button @click="handleClose" size="large" class="cancel-btn" :disabled="petStore.medicationRecordFormModal.loading">
          取消
        </n-button>
        <n-button type="primary" @click="handleSubmit" :loading="petStore.medicationRecordFormModal.loading" size="large" class="submit-btn submit-btn--medication">
          <span class="submit-btn-text">保存</span>
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
.medication-form-modal-wrap :deep(.n-modal-mask) {
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(6px);
}

.medication-form-modal-wrap :deep(.n-modal-body-wrapper) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.medication-form-modal-wrap :deep(.n-modal) {
  width: 520px !important;
  max-width: calc(100vw - 32px);
  padding: 0 !important;
}

/* Glass Card */
.form-glass-card {
  position: relative;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3);
  animation: medication-card-in 0.35s ease forwards;
  overflow: hidden;
}

@keyframes medication-card-in {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

:global(.dark-mode) .form-glass-card {
  background: rgba(35, 30, 50, 0.95);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);
}

/* Medication theme accent */
.form-glass-card--medication {
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.2);
}

:global(.dark-mode) .form-glass-card--medication {
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.15);
}

/* Floating decorations */
.form-decor {
  position: absolute;
  font-size: 18px;
  opacity: 0.3;
  pointer-events: none;
  animation: decor-float 5s ease-in-out infinite;
}

.form-decor-1 { top: 10%; left: 8%; animation-delay: 0s; }
.form-decor-2 { top: 15%; right: 10%; animation-delay: 1.2s; font-size: 14px; }
.form-decor-3 { bottom: 20%; left: 12%; animation-delay: 2.4s; font-size: 16px; }
.form-decor-4 { bottom: 15%; right: 8%; animation-delay: 0.8s; font-size: 20px; }

@keyframes decor-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(5deg); }
  50% { transform: translateY(-12px) rotate(-3deg); }
  75% { transform: translateY(-5px) rotate(2deg); }
}

:global(.dark-mode) .form-decor { opacity: 0.2; }

/* Close button */
.form-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: #9CA3AF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  z-index: 2;
}

.form-close-btn:hover {
  background: rgba(139, 92, 246, 0.12);
  color: #7C3AED;
  transform: rotate(90deg);
}

:global(.dark-mode) .form-close-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #8888A0;
}

:global(.dark-mode) .form-close-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  color: #A78BFA;
}

/* Header */
.form-header {
  text-align: center;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.form-header-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  animation: icon-bounce 2s ease-in-out infinite;
}

.form-header-icon--medication {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%);
}

@keyframes icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.form-title {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 4px;
}

.form-title--medication {
  background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #A78BFA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:global(.dark-mode) .form-title--medication {
  background: linear-gradient(135deg, #A78BFA 0%, #C4B5FD 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.form-subtitle {
  margin: 0;
  font-size: 14px;
  color: #9CA3AF;
  font-weight: 500;
}

:global(.dark-mode) .form-subtitle {
  color: #8888A0;
}

/* Form body */
.form-body {
  position: relative;
  z-index: 1;
}

.form-body :deep(.n-input),
.form-body :deep(.n-input-number),
.form-body :deep(.n-date-picker),
.form-body :deep(.n-select) {
  border-radius: 14px !important;
}

.form-body :deep(.n-input .n-input__border),
.form-body :deep(.n-input .n-input__state-border),
.form-body :deep(.n-input-number .n-input__border),
.form-body :deep(.n-input-number .n-input__state-border) {
  border-radius: 14px !important;
}

.form-body :deep(.n-input:hover),
.form-body :deep(.n-input-number:hover),
.form-body :deep(.n-select:hover) {
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.08);
}

.form-body :deep(.n-input:focus-within),
.form-body :deep(.n-input-number:focus-within),
.form-body :deep(.n-select:focus-within) {
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row-item {
  flex: 1;
}

/* Footer */
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  position: relative;
  z-index: 1;
}

.cancel-btn {
  border-radius: 12px !important;
  font-weight: 600;
}

.submit-btn {
  border-radius: 12px !important;
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.submit-btn--medication {
  background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%) !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
}

.submit-btn--medication:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.submit-btn-text {
  position: relative;
  z-index: 1;
}

/* Mobile */
@media (max-width: 480px) {
  .form-glass-card {
    padding: 24px 20px;
    border-radius: 20px;
  }

  .form-title {
    font-size: 20px;
  }

  .form-header-icon {
    width: 48px;
    height: 48px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
