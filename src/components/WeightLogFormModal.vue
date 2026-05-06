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
  useMessage,
} from 'naive-ui';

const petStore = usePetStore();
const message = useMessage();
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
  formRef.value?.validate(async (errors) => {
    if (errors) {
      return;
    }
    try {
      await petStore.handleSaveWeightLog();
    } catch {
      message.error('保存体重记录失败，请重试');
    }
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
    :bordered="false"
    :mask-closable="false"
    class="weight-form-modal-wrap"
    transform-origin="center"
  >
    <div class="form-glass-card form-glass-card--weight">
      <!-- 浮动装饰 -->
      <div class="form-decor form-decor-1">⚖️</div>
      <div class="form-decor form-decor-2">📊</div>
      <div class="form-decor form-decor-3">✨</div>
      <div class="form-decor form-decor-4">📏</div>

      <!-- 关闭按钮 -->
      <button class="form-close-btn" @click="handleClose" aria-label="关闭">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <!-- 头部 -->
      <div class="form-header">
        <div class="form-header-icon form-header-icon--weight">
          <span style="font-size: 28px;">⚖️</span>
        </div>
        <h2 class="form-title form-title--weight">{{ petStore.weightLogFormModal.isEdit ? '编辑体重记录' : '记录体重' }}</h2>
        <p class="form-subtitle">{{ petStore.weightLogFormModal.isEdit ? '更新体重数据' : '记录宠物体重变化 📈' }}</p>
      </div>

      <!-- 表单内容 -->
      <div v-if="petStore.weightLogFormModal.data" class="form-body">
        <n-form ref="formRef" :model="petStore.weightLogFormModal.data" @submit.prevent="handleSubmit" label-placement="top" :rules="rules">
          <n-form-item label="体重 (kg)" path="weightKg" required :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input-number
              v-model:value="petStore.weightLogFormModal.data.weightKg"
              :min="0.1"
              :max="200"
              :step="0.1"
              placeholder="输入体重"
              style="width: 100%;"
              size="large"
              :disabled="petStore.weightLogFormModal.loading"
            />
          </n-form-item>

          <n-form-item label="记录日期" path="logDate" required :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-date-picker
              v-model:value="petStore.weightLogFormModal.data.logDate"
              type="date"
              value-format="yyyy-MM-dd"
              style="width: 100%;"
              size="large"
              :disabled="petStore.weightLogFormModal.loading"
            />
          </n-form-item>
        </n-form>
      </div>

      <!-- 底部按钮 -->
      <div class="form-footer">
        <n-button @click="handleClose" size="large" class="cancel-btn" :disabled="petStore.weightLogFormModal.loading">
          取消
        </n-button>
        <n-button type="primary" @click="handleSubmit" :loading="petStore.weightLogFormModal.loading" size="large" class="submit-btn submit-btn--weight">
          <span class="submit-btn-text">保存</span>
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
/* 模态框外层 */
.weight-form-modal-wrap :deep(.n-modal-mask) {
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(6px);
}

.weight-form-modal-wrap :deep(.n-modal-body-wrapper) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.weight-form-modal-wrap :deep(.n-modal) {
  width: 460px !important;
  max-width: calc(100vw - 32px);
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  margin: 0 !important;
}

/* 毛玻璃卡片 */
.form-glass-card {
  position: relative;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 28px;
  padding: 32px 32px 28px;
  overflow: hidden;
  box-shadow:
    0 8px 32px rgba(96, 165, 250, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  animation: form-card-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.form-glass-card::-webkit-scrollbar { width: 4px; }
.form-glass-card::-webkit-scrollbar-thumb { background: rgba(96, 165, 250, 0.2); border-radius: 4px; }

.dark-mode .form-glass-card,
[data-theme="dark"] .form-glass-card {
  background: rgba(37, 37, 66, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.5),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

@keyframes form-card-in {
  0% { opacity: 0; transform: scale(0.92) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* 关闭按钮 */
.form-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  transition: all 0.2s ease;
  z-index: 2;
}

.form-close-btn:hover {
  background: rgba(96, 165, 250, 0.12);
  color: #60A5FA;
  transform: rotate(90deg);
}

.dark-mode .form-close-btn,
[data-theme="dark"] .form-close-btn {
  background: rgba(255, 255, 255, 0.06);
  color: #8888A0;
}

.dark-mode .form-close-btn:hover,
[data-theme="dark"] .form-close-btn:hover {
  background: rgba(96, 165, 250, 0.15);
  color: #93BBFC;
}

/* 浮动装饰 */
.form-decor {
  position: absolute;
  pointer-events: none;
  opacity: 0.2;
  z-index: 0;
}

.form-decor-1 { top: 10px; left: 18px; font-size: 16px; animation: form-float 6s ease-in-out infinite; }
.form-decor-2 { top: 36px; right: 48px; font-size: 13px; animation: form-float 5s ease-in-out infinite 1s; }
.form-decor-3 { bottom: 60px; left: 14px; font-size: 14px; animation: form-float 7s ease-in-out infinite 0.5s; }
.form-decor-4 { bottom: 30px; right: 18px; font-size: 18px; animation: form-float 8s ease-in-out infinite 2s; }

@keyframes form-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-6px) rotate(4deg); }
  50% { transform: translateY(-3px) rotate(-2deg); }
  75% { transform: translateY(-8px) rotate(2deg); }
}

/* 头部 */
.form-header {
  text-align: center;
  padding: 0 0 20px;
  position: relative;
  z-index: 1;
}

.form-header-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  animation: form-icon-bounce 3s ease-in-out infinite;
}

.form-header-icon--weight {
  background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%);
  box-shadow: 0 4px 16px rgba(96, 165, 250, 0.3);
}

@keyframes form-icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.form-title {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.form-title--weight {
  background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-subtitle {
  color: #9CA3AF;
  font-size: 13px;
  font-weight: 500;
}

.dark-mode .form-subtitle,
[data-theme="dark"] .form-subtitle {
  color: #8888A0;
}

/* 表单内容 */
.form-body {
  position: relative;
  z-index: 1;
}

.form-body :deep(.n-form-item-label) {
  font-weight: 600 !important;
}

.form-body :deep(.n-input),
.form-body :deep(.n-input-number) {
  border-radius: 14px !important;
  transition: all 0.3s ease;
}

.form-body :deep(.n-input:hover) {
  box-shadow: 0 2px 12px rgba(96, 165, 250, 0.12);
}

.form-body :deep(.n-input--focus) {
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15), 0 2px 12px rgba(96, 165, 250, 0.12);
}

.form-body :deep(.n-date-picker .n-input) {
  border-radius: 14px !important;
}

.dark-mode .form-body :deep(.n-input),
[data-theme="dark"] .form-body :deep(.n-input) {
  border-color: #3D3D5C;
}

.dark-mode .form-body :deep(.n-input:hover),
[data-theme="dark"] .form-body :deep(.n-input:hover) {
  box-shadow: 0 2px 12px rgba(96, 165, 250, 0.08);
}

/* 底部 */
.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  position: relative;
  z-index: 1;
}

.cancel-btn {
  border-radius: 14px !important;
  font-weight: 600 !important;
  padding: 0 24px !important;
  transition: all 0.2s ease !important;
}

.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.04) !important;
}

.dark-mode .cancel-btn:hover,
[data-theme="dark"] .cancel-btn:hover {
  background: rgba(255, 255, 255, 0.06) !important;
}

.submit-btn {
  border: none !important;
  border-radius: 14px !important;
  font-weight: 700 !important;
  padding: 0 28px !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  position: relative;
  overflow: hidden;
}

.submit-btn--weight {
  background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%) !important;
  box-shadow:
    0 4px 15px rgba(96, 165, 250, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.submit-btn:hover {
  transform: translateY(-2px) !important;
}

.submit-btn--weight:hover {
  box-shadow: 0 6px 20px rgba(96, 165, 250, 0.4) !important;
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:active {
  transform: translateY(0) !important;
}

.submit-btn-text {
  position: relative;
  z-index: 1;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .form-glass-card {
    padding: 24px 20px 20px;
    border-radius: 24px;
  }

  .form-header-icon {
    width: 52px;
    height: 52px;
  }

  .form-title {
    font-size: 19px;
  }
}
</style>
