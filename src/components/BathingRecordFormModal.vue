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

const serviceTypeOptions = [
  { label: '洗澡', value: '洗澡' },
  { label: '美容', value: '美容' },
  { label: '梳毛', value: '梳毛' },
  { label: '剪指甲', value: '剪指甲' },
  { label: '清洁耳朵', value: '清洁耳朵' },
  { label: '刷牙', value: '刷牙' },
  { label: '修剪毛发', value: '修剪毛发' },
  { label: '药浴', value: '药浴' }
];

const rules = {
  bathTime: [
    { required: true, message: '请选择洗澡/美容时间', trigger: 'change' }
  ],
  serviceType: [
    { required: true, message: '请选择服务类型', trigger: 'change' }
  ]
};

const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) return;
    try {
      await petStore.handleSaveBathingRecord();
      message.success(petStore.bathingRecordFormModal.isEdit ? '记录已更新' : '记录已添加');
    } catch {
      message.error('保存洗澡美容记录失败，请重试');
    }
  });
};

const handleClose = () => {
  petStore.closeBathingRecordFormModal();
};
</script>

<template>
  <n-modal
    :show="petStore.bathingRecordFormModal.show"
    @update:show="handleClose"
    :bordered="false"
    :mask-closable="false"
    class="bathing-form-modal-wrap"
    transform-origin="center"
  >
    <div class="form-glass-card form-glass-card--bathing">
      <!-- 浮动装饰 -->
      <div class="form-decor form-decor-1">🛁</div>
      <div class="form-decor form-decor-2">✨</div>
      <div class="form-decor form-decor-3">🧴</div>
      <div class="form-decor form-decor-4">🫧</div>

      <!-- 关闭按钮 -->
      <button class="form-close-btn" @click="handleClose" aria-label="关闭">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <!-- 头部 -->
      <div class="form-header">
        <div class="form-header-icon form-header-icon--bathing">
          <span style="font-size: 28px;">🛁</span>
        </div>
        <h2 class="form-title form-title--bathing">{{ petStore.bathingRecordFormModal.isEdit ? '编辑洗澡美容记录' : '记录洗澡美容' }}</h2>
        <p class="form-subtitle">{{ petStore.bathingRecordFormModal.isEdit ? '更新服务信息' : '记录宠物美容护理 🐾' }}</p>
      </div>

      <!-- 表单内容 -->
      <div v-if="petStore.bathingRecordFormModal.data" class="form-body">
        <n-form ref="formRef" @submit.prevent="handleSubmit" label-placement="top" :rules="rules">
          <n-form-item label="服务时间" path="bathTime" required :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-date-picker
              v-model:value="petStore.bathingRecordFormModal.data.bathTime"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm"
              style="width: 100%;"
              size="large"
              :disabled="petStore.bathingRecordFormModal.loading"
            />
          </n-form-item>

          <n-form-item label="服务类型" path="serviceType" required :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-select
              v-model:value="petStore.bathingRecordFormModal.data.serviceType"
              :options="serviceTypeOptions"
              placeholder="请选择服务类型"
              size="large"
              :disabled="petStore.bathingRecordFormModal.loading"
            />
          </n-form-item>

          <n-form-item label="备注" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input
              v-model:value="petStore.bathingRecordFormModal.data.notes"
              type="textarea"
              placeholder="如：用了新沐浴露、皮肤状态、特殊护理..."
              :rows="3"
              size="large"
              :maxlength="500"
              show-count
              :disabled="petStore.bathingRecordFormModal.loading"
            />
          </n-form-item>
        </n-form>
      </div>

      <!-- 底部按钮 -->
      <div class="form-footer">
        <n-button @click="handleClose" size="large" class="cancel-btn" :disabled="petStore.bathingRecordFormModal.loading">
          取消
        </n-button>
        <n-button type="primary" @click="handleSubmit" :loading="petStore.bathingRecordFormModal.loading" size="large" class="submit-btn submit-btn--bathing">
          <span class="submit-btn-text">保存</span>
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
.bathing-form-modal-wrap :deep(.n-modal-mask) {
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(6px);
}

.bathing-form-modal-wrap :deep(.n-modal-body-wrapper) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.bathing-form-modal-wrap :deep(.n-modal) {
  width: 500px !important;
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
  animation: bathing-card-in 0.35s ease forwards;
  overflow: hidden;
}

@keyframes bathing-card-in {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

:root[data-theme="dark"] .form-glass-card {
  background: rgba(35, 30, 50, 0.95);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);
}

/* Bathing theme accent */
.form-glass-card--bathing {
  box-shadow: 0 20px 60px rgba(6, 182, 212, 0.15), 0 0 0 1px rgba(6, 182, 212, 0.2);
}

:root[data-theme="dark"] .form-glass-card--bathing {
  box-shadow: 0 20px 60px rgba(6, 182, 212, 0.2), 0 0 0 1px rgba(6, 182, 212, 0.15);
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

:root[data-theme="dark"] .form-decor { opacity: 0.2; }

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
  background: rgba(6, 182, 212, 0.12);
  color: #0891B2;
  transform: rotate(90deg);
}

:root[data-theme="dark"] .form-close-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #8888A0;
}

:root[data-theme="dark"] .form-close-btn:hover {
  background: rgba(6, 182, 212, 0.2);
  color: #22D3EE;
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

.form-header-icon--bathing {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(34, 211, 238, 0.12) 100%);
}

@keyframes icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.form-title {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 4px;
  background: linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #22D3EE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:root[data-theme="dark"] .form-title {
  background: linear-gradient(135deg, #22D3EE 0%, #67E8F9 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.form-subtitle {
  margin: 0;
  font-size: 14px;
  color: #9CA3AF;
  font-weight: 500;
}

:root[data-theme="dark"] .form-subtitle {
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
  box-shadow: 0 2px 12px rgba(6, 182, 212, 0.08);
}

.form-body :deep(.n-input:focus-within),
.form-body :deep(.n-input-number:focus-within),
.form-body :deep(.n-select:focus-within) {
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
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

.submit-btn--bathing {
  background: linear-gradient(135deg, #0891B2 0%, #06B6D4 100%) !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
  transition: all 0.3s ease;
}

.submit-btn--bathing:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
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
}
</style>
