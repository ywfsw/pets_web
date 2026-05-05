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
  NSpace,
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
    preset="card"
    style="width: 550px; border-radius: 24px;"
    :title="petStore.petFormModal.isEdit ? '编辑萌宠' : '添加新萌宠'"
    :bordered="false"
    :loading="petStore.petFormModal.loading || isUploading"
    class="pet-form-modal"
    :mask-closable="false"
  >
    <div v-if="petStore.petFormModal.data">
      <n-form ref="formRef" @submit.prevent="handleSubmit" label-placement="top" :rules="rules">
        <!-- 头像上传 -->
        <n-form-item label="宠物头像" label-style="font-weight: 600;">
          <n-space align="center" justify="center" vertical>
            <div class="avatar-upload-wrapper">
              <n-avatar
                round
                :size="120"
                :src="getAvatarUrl(petStore.petFormModal.data.profileImageUrl)"
                style="border: 4px solid #FFE4E9; box-shadow: 0 4px 20px rgba(255, 155, 168, 0.2);"
              />
              <div class="avatar-upload-overlay" @click="handleImageUpload" :class="{ uploading: isUploading }">
                <n-icon :component="CameraOutline" size="28" />
                <span>{{ isUploading ? '上传中...' : '更换' }}</span>
              </div>
            </div>
            <n-text v-if="uploadError" type="error" depth="2">
              上传失败: {{ uploadError }}
            </n-text>
          </n-space>
        </n-form-item>

        <!-- 名字 -->
        <n-form-item label="名字" required label-style="font-weight: 600;">
          <n-input
            v-model:value="petStore.petFormModal.data.name"
            placeholder="输入宠物的名字"
            size="large"
            :disabled="petStore.petFormModal.loading"
          >
            <template #prefix>
              <n-icon :component="PawOutline" color="#9CA3AF" />
            </template>
          </n-input>
        </n-form-item>

        <!-- 生日 -->
        <n-form-item label="生日" label-style="font-weight: 600;">
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
        <n-form-item label="性别" label-style="font-weight: 600;">
          <n-select
            v-model:value="petStore.petFormModal.data.gender"
            :options="genderOptions"
            placeholder="请选择性别（可不填）"
            size="large"
            clearable
            :disabled="petStore.petFormModal.loading"
          />
        </n-form-item>

        <!-- 物种 -->
        <n-form-item label="物种" path="speciesId" required label-style="font-weight: 600;">
          <n-select
            v-model:value="petStore.petFormModal.data.speciesId"
            :options="speciesOptions"
            placeholder="请选择物种"
            size="large"
            :disabled="petStore.petFormModal.loading"
          />
        </n-form-item>

        <!-- 品种 -->
        <n-form-item label="品种" label-style="font-weight: 600;">
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
        <n-form-item label="备注" label-style="font-weight: 600;">
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

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose" size="large" class="cancel-btn">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="petStore.petFormModal.loading" size="large" class="save-btn">
          {{ petStore.petFormModal.isEdit ? '保存修改' : '添加萌宠' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.pet-form-modal :deep(.n-card-header) {
  padding-bottom: 0;
}

/* 头像上传 */
.avatar-upload-wrapper {
  position: relative;
  cursor: pointer;
}

.avatar-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: all 0.3s ease;
  font-size: 12px;
}

.avatar-upload-wrapper:hover .avatar-upload-overlay {
  opacity: 1;
}

.avatar-upload-overlay.uploading {
  opacity: 1;
  cursor: not-allowed;
}

/* 按钮 */
.cancel-btn {
  border-radius: 12px;
}

.save-btn {
  background: linear-gradient(135deg, var(--pet-primary) 0%, var(--pet-primarySuppl) 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(255, 155, 168, 0.3);
  transition: all 0.3s ease;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.4);
}

/* 表单项样式 */
.pet-form-modal :deep(.n-form-item-label) {
  font-weight: 600;
  color: var(--pet-text);
}

.pet-form-modal :deep(.n-input) {
  border-radius: 12px;
}

.pet-form-modal :deep(.n-select) {
  border-radius: 12px;
}
</style>
