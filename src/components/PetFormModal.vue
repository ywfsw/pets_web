<script setup>
import { computed, ref } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { useCloudinaryUpload } from '@/composables/useCloudinaryUpload.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';

import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDatePicker,
  NButton,
  NAvatar,
  NText,
  NIcon,
  useMessage
} from 'naive-ui';
import { CameraOutline, PawOutline } from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();
const dictStore = useDictionaryStore();
const message = useMessage();
const { isUploading, uploadError, openUploadWidget } = useCloudinaryUpload();
const { getAvatarUrl } = useCloudinaryImage();
const formRef = ref(null);

const speciesOptions = computed(() =>
  dictStore.species.map(s => ({ label: s.itemLabel, value: s.id }))
);

const genderOptions = [
  { label: '♂ 公', value: 'male' },
  { label: '♀ 母', value: 'female' }
];

const breedOptions = computed(() => {
  if (!petStore.petFormModal.data?.speciesId) return [];
  return dictStore.breeds
    .filter(b => b.parentId === petStore.petFormModal.data.speciesId)
    .map(b => ({ label: b.itemLabel, value: b.id }));
});

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入宠物名字', trigger: 'blur' },
    { min: 1, max: 20, message: '名字长度应为 1-20 个字符', trigger: 'blur' }
  ],
  speciesId: [
    { required: true, type: 'number', message: '请选择宠物物种', trigger: 'change' }
  ]
};

const handleSubmit = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      return;
    }
    try {
      await petStore.handleSavePet();
      message.success(petStore.petFormModal.isEdit ? '宠物信息已更新' : '萌宠添加成功');
    } catch {
      message.error('保存宠物信息失败，请重试');
    }
  });
};

const handleImageUpload = () => {
  openUploadWidget(
    {
      folder: 'pet-avatars',
      tags: ['editing', petStore.petFormModal.data.id ? 'edit' : 'create']
    },
    ({ url, publicId }) => {
      if (petStore.petFormModal.data) {
        petStore.petFormModal.data.profileImageUrl = url;
        petStore.petFormModal.data.profileImagePublicId = publicId;
      }
    }
  );
};

const handleClose = () => {
  petStore.closeAllPetModals();
};
</script>

<template>
  <n-modal
    :show="petStore.petFormModal.show"
    @update:show="handleClose"
    :bordered="false"
    :mask-closable="false"
    class="pet-form-modal-wrap"
    transform-origin="center"
  >
    <div class="form-glass-card">
      <!-- 浮动装饰 -->
      <div class="form-decor form-decor-1">🐾</div>
      <div class="form-decor form-decor-2">✨</div>
      <div class="form-decor form-decor-3">🐱</div>
      <div class="form-decor form-decor-4">💕</div>

      <!-- 关闭按钮 -->
      <button class="form-close-btn" @click="handleClose" aria-label="关闭">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <!-- 头部 -->
      <div class="form-header">
        <div class="form-header-icon">
          <n-icon :component="PawOutline" size="32" color="#fff" />
        </div>
        <h2 class="form-title">{{ petStore.petFormModal.isEdit ? '编辑萌宠' : '添加新萌宠' }}</h2>
        <p class="form-subtitle">{{ petStore.petFormModal.isEdit ? '更新宠物资料信息' : '填写萌宠基本信息 🐶' }}</p>
      </div>

      <!-- 加载态 -->
      <div v-if="petStore.petFormModal.loading || isUploading" class="form-loading-overlay">
        <div class="form-loading-spinner"></div>
        <span>{{ isUploading ? '头像上传中...' : '保存中...' }}</span>
      </div>

      <!-- 表单内容 -->
      <div v-if="petStore.petFormModal.data" class="form-body">
        <n-form ref="formRef" @submit.prevent="handleSubmit" label-placement="top" :rules="rules">
          <!-- 头像上传 -->
          <n-form-item label="宠物头像" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <div class="avatar-section">
              <div class="avatar-upload-wrapper">
                <n-avatar
                  round
                  :size="100"
                  :src="getAvatarUrl(petStore.petFormModal.data.profileImageUrl)"
                />
                <div class="avatar-upload-overlay" @click="handleImageUpload" :class="{ uploading: isUploading }">
                  <n-icon :component="CameraOutline" size="24" />
                  <span>{{ isUploading ? '上传中...' : '更换' }}</span>
                </div>
              </div>
              <n-text v-if="uploadError" type="error" depth="2" style="margin-top: 8px; font-size: 13px;">
                上传失败: {{ uploadError }}
              </n-text>
            </div>
          </n-form-item>

          <!-- 名字 -->
          <n-form-item label="名字" path="name" required :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input
              v-model:value="petStore.petFormModal.data.name"
              placeholder="输入宠物的名字"
              size="large"
              :disabled="petStore.petFormModal.loading"
            >
              <template #prefix>
                <n-icon :component="PawOutline" />
              </template>
            </n-input>
          </n-form-item>

          <div class="form-row">
            <!-- 生日 -->
            <n-form-item label="生日" class="form-row-item" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
              <n-date-picker
                v-model:value="petStore.petFormModal.data.birthday"
                type="date"
                value-format="yyyy-MM-dd"
                style="width: 100%;"
                size="large"
                :disabled="petStore.petFormModal.loading"
              />
            </n-form-item>

            <!-- 性别 -->
            <n-form-item label="性别" class="form-row-item" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
              <n-select
                v-model:value="petStore.petFormModal.data.gender"
                :options="genderOptions"
                placeholder="可不填"
                size="large"
                clearable
                :disabled="petStore.petFormModal.loading"
              />
            </n-form-item>
          </div>

          <!-- 物种 -->
          <n-form-item label="物种" path="speciesId" required :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-select
              v-model:value="petStore.petFormModal.data.speciesId"
              :options="speciesOptions"
              placeholder="请选择物种"
              size="large"
              :disabled="petStore.petFormModal.loading"
            />
          </n-form-item>

          <!-- 品种 -->
          <n-form-item label="品种" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-select
              v-model:value="petStore.petFormModal.data.breedId"
              :options="breedOptions"
              :disabled="!petStore.petFormModal.data.speciesId || petStore.petFormModal.loading"
              placeholder="请先选择物种"
              clearable
              size="large"
            />
          </n-form-item>

          <!-- 备注 -->
          <n-form-item label="备注" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
            <n-input
              v-model:value="petStore.petFormModal.data.notes"
              type="textarea"
              placeholder="记录宠物的个性、饮食偏好、特殊注意事项等..."
              :rows="3"
              size="large"
              :maxlength="500"
              show-count
              :disabled="petStore.petFormModal.loading"
            />
          </n-form-item>
        </n-form>
      </div>

      <!-- 底部按钮 -->
      <div class="form-footer">
        <n-button @click="handleClose" size="large" class="cancel-btn" :disabled="petStore.petFormModal.loading">
          取消
        </n-button>
        <n-button type="primary" @click="handleSubmit" :loading="petStore.petFormModal.loading" size="large" class="submit-btn">
          <span class="submit-btn-text">{{ petStore.petFormModal.isEdit ? '保存修改' : '添加萌宠' }}</span>
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
/* 模态框外层 */
.pet-form-modal-wrap :deep(.n-modal-mask) {
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(6px);
}

.pet-form-modal-wrap :deep(.n-modal-body-wrapper) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.pet-form-modal-wrap :deep(.n-modal) {
  width: 520px !important;
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
    0 8px 32px rgba(255, 155, 168, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  animation: form-card-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.form-glass-card::-webkit-scrollbar {
  width: 4px;
}

.form-glass-card::-webkit-scrollbar-thumb {
  background: rgba(255, 155, 168, 0.2);
  border-radius: 4px;
}

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
  background: rgba(255, 155, 168, 0.12);
  color: #FF7A8A;
  transform: rotate(90deg);
}

.dark-mode .form-close-btn,
[data-theme="dark"] .form-close-btn {
  background: rgba(255, 255, 255, 0.06);
  color: #8888A0;
}

.dark-mode .form-close-btn:hover,
[data-theme="dark"] .form-close-btn:hover {
  background: rgba(255, 155, 168, 0.15);
  color: #FFB4C2;
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
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 50%, #FFB4C2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  box-shadow: 0 4px 16px rgba(255, 155, 168, 0.3);
  animation: form-icon-bounce 3s ease-in-out infinite;
}

@keyframes form-icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.form-title {
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, #FF7A8A 0%, #FF9BA8 50%, #FFB4C2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.dark-mode .form-title,
[data-theme="dark"] .form-title {
  background: linear-gradient(135deg, #FFB4C2 0%, #FF9BA8 50%, #FF7A8A 100%);
  -webkit-background-clip: text;
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

/* 加载态 */
.form-loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  color: #FF9BA8;
  font-size: 14px;
  font-weight: 500;
}

.form-loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 155, 168, 0.2);
  border-top-color: #FF9BA8;
  border-radius: 50%;
  animation: form-spin 0.8s linear infinite;
}

@keyframes form-spin {
  to { transform: rotate(360deg); }
}

/* 表单内容 */
.form-body {
  position: relative;
  z-index: 1;
}

.form-body :deep(.n-form-item-label) {
  font-weight: 600 !important;
}

.form-body :deep(.n-input) {
  border-radius: 14px !important;
  transition: all 0.3s ease;
}

.form-body :deep(.n-input:hover) {
  box-shadow: 0 2px 12px rgba(255, 155, 168, 0.12);
}

.form-body :deep(.n-input--focus) {
  box-shadow: 0 0 0 3px rgba(255, 155, 168, 0.15), 0 2px 12px rgba(255, 155, 168, 0.12);
}

.form-body :deep(.n-input__prefix) {
  color: #C4B5B8;
  margin-right: 4px;
}

.form-body :deep(.n-select .n-base-selection) {
  border-radius: 14px !important;
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
  box-shadow: 0 2px 12px rgba(255, 155, 168, 0.08);
}

.dark-mode .form-body :deep(.n-input__prefix),
[data-theme="dark"] .form-body :deep(.n-input__prefix) {
  color: #8888A0;
}

/* 行内表单项 */
.form-row {
  display: flex;
  gap: 16px;
}

.form-row-item {
  flex: 1;
}

@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}

/* 头像 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.avatar-upload-wrapper {
  position: relative;
  cursor: pointer;
}

.avatar-upload-wrapper :deep(.n-avatar) {
  border: 3px solid rgba(255, 155, 168, 0.3);
  box-shadow: 0 4px 16px rgba(255, 155, 168, 0.2);
  transition: all 0.3s ease;
}

.avatar-upload-wrapper:hover :deep(.n-avatar) {
  box-shadow: 0 6px 24px rgba(255, 155, 168, 0.3);
  transform: scale(1.03);
}

.avatar-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: all 0.3s ease;
  font-size: 11px;
  gap: 2px;
}

.avatar-upload-wrapper:hover .avatar-upload-overlay {
  opacity: 1;
}

.avatar-upload-overlay.uploading {
  opacity: 1;
  cursor: not-allowed;
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
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 50%, #FFB4C2 100%) !important;
  border: none !important;
  border-radius: 14px !important;
  font-weight: 700 !important;
  padding: 0 28px !important;
  box-shadow:
    0 4px 15px rgba(255, 155, 168, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  position: relative;
  overflow: hidden;
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
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.4) !important;
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

  .form-header-icon :deep(.n-icon) {
    font-size: 24px !important;
  }

  .form-title {
    font-size: 19px;
  }

  .submit-btn {
    padding: 0 20px !important;
  }
}
</style>
