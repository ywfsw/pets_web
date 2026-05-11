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
    :bordered="false"
    :mask-closable="false"
    class="dict-form-modal-wrap"
    transform-origin="center"
  >
    <div class="form-glass-card form-glass-card--dict">
      <!-- 浮动装饰 -->
      <div class="form-decor form-decor-1">📋</div>
      <div class="form-decor form-decor-2">✨</div>
      <div class="form-decor form-decor-3">⚙️</div>
      <div class="form-decor form-decor-4">📝</div>

      <!-- 关闭按钮 -->
      <button class="form-close-btn" @click="handleClose" aria-label="关闭">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <!-- 头部 -->
      <div class="form-header">
        <div class="form-header-icon form-header-icon--dict">
          <span style="font-size: 28px;">📋</span>
        </div>
        <h2 class="form-title form-title--dict">{{ dictStore.itemFormModal.isEdit ? '编辑字典项' : '创建新字典项' }}</h2>
        <p class="form-subtitle">{{ dictStore.itemFormModal.isEdit ? '更新字典项配置' : '添加新的字典数据 🔧' }}</p>
      </div>

      <!-- 表单内容 -->
      <div class="form-body">
        <n-form ref="formRef" @submit.prevent="handleSubmit" label-placement="top" :rules="rules">
          <n-form-item label="字典编码 (Code)" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input v-model:value="formData.dictCode" readonly disabled size="large" />
          </n-form-item>

          <n-form-item label="标签 (Label)" path="itemLabel" required :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input v-model:value="formData.itemLabel" :disabled="dictStore.itemFormModal.loading" size="large" />
          </n-form-item>

          <n-form-item label="值 (Value)" path="itemValue" required :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input v-model:value="formData.itemValue" :disabled="dictStore.itemFormModal.loading" size="large" />
          </n-form-item>

          <n-form-item label="父级 (可选)" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-select
              v-model:value="formData.parentId"
              :options="parentSelectOptions"
              :loading="loadingOptions"
              :disabled="loadingOptions || !dictStore.itemFormModal.contextType?.parentCode"
              placeholder="请选择父级"
              clearable
              size="large"
            />
          </n-form-item>

          <n-form-item label="排序" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input-number v-model:value="formData.sortOrder" style="width: 100%;" size="large" />
          </n-form-item>
        </n-form>
      </div>

      <!-- 底部按钮 -->
      <div class="form-footer">
        <n-button @click="handleClose" size="large" class="cancel-btn" :disabled="dictStore.itemFormModal.loading">
          取消
        </n-button>
        <n-button type="primary" @click="handleSubmit" :loading="dictStore.itemFormModal.loading" size="large" class="submit-btn submit-btn--dict">
          <span class="submit-btn-text">保存</span>
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
/* 模态框外层 */
.dict-form-modal-wrap :deep(.n-modal-mask) {
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(6px);
}

.dict-form-modal-wrap :deep(.n-modal-body-wrapper) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.dict-form-modal-wrap :deep(.n-modal) {
  width: 500px !important;
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
    0 8px 32px rgba(139, 92, 246, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  animation: form-card-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.form-glass-card::-webkit-scrollbar { width: 4px; }
.form-glass-card::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 4px; }

:root[data-theme="dark"] .form-glass-card,
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
  background: rgba(139, 92, 246, 0.12);
  color: #8B5CF6;
  transform: rotate(90deg);
}

:root[data-theme="dark"] .form-close-btn,
[data-theme="dark"] .form-close-btn {
  background: rgba(255, 255, 255, 0.06);
  color: #8888A0;
}

:root[data-theme="dark"] .form-close-btn:hover,
[data-theme="dark"] .form-close-btn:hover {
  background: rgba(139, 92, 246, 0.15);
  color: #A78BFA;
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

.form-header-icon--dict {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
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

.form-title--dict {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-subtitle {
  color: #9CA3AF;
  font-size: 13px;
  font-weight: 500;
}

:root[data-theme="dark"] .form-subtitle,
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
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.12);
}

.form-body :deep(.n-input--focus) {
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15), 0 2px 12px rgba(139, 92, 246, 0.12);
}

.form-body :deep(.n-select .n-base-selection) {
  border-radius: 14px !important;
}

:root[data-theme="dark"] .form-body :deep(.n-input),
[data-theme="dark"] .form-body :deep(.n-input) {
  border-color: #3D3D5C;
}

:root[data-theme="dark"] .form-body :deep(.n-input:hover),
[data-theme="dark"] .form-body :deep(.n-input:hover) {
  box-shadow: 0 2px 12px rgba(139, 92, 246, 0.08);
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

:root[data-theme="dark"] .cancel-btn:hover,
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

.submit-btn--dict {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%) !important;
  box-shadow:
    0 4px 15px rgba(139, 92, 246, 0.3),
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

.submit-btn--dict:hover {
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4) !important;
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
