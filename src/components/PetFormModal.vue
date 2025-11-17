<script setup>
import { computed } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { useCloudinaryUpload } from '@/composables/useCloudinaryUpload.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';

import {
  NModal,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDatePicker,
  NButton,
  NSpace,
  NAvatar,
  NText,
} from 'naive-ui';

const petStore = usePetStore();
const dictStore = useDictionaryStore();
const { isUploading, uploadError, openUploadWidget } = useCloudinaryUpload();
const { getAvatarUrl } = useCloudinaryImage();

const speciesOptions = computed(() =>
  dictStore.species.map(s => ({ label: s.itemLabel, value: s.id }))
);

const breedOptions = computed(() => {
  if (!petStore.petFormModal.data?.speciesId) return [];
  return dictStore.breeds
    .filter(b => b.parentId === petStore.petFormModal.data.speciesId)
    .map(b => ({ label: b.itemLabel, value: b.id }));
});

const handleSubmit = () => {
  petStore.handleSavePet();
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
    style="width: 600px;"
    :title="petStore.petFormModal.isEdit ? '编辑宠物' : '创建新宠物'"
    :bordered="false"
    :loading="petStore.petFormModal.loading || isUploading"
  >
    <div v-if="petStore.petFormModal.data">
      <n-form @submit.prevent="handleSubmit">
        <n-form-item label="宠物头像">
          <n-space align="center">
            <n-avatar
              round
              :size="120"
              :src="getAvatarUrl(petStore.petFormModal.data.profileImageUrl)"
            />
            <n-space vertical>
              <n-button
                @click="handleImageUpload"
                :loading="isUploading"
                :disabled="isUploading"
              >
                {{ petStore.petFormModal.data.profileImageUrl ? '更换图片' : '上传图片' }}
              </n-button>
              <n-text v-if="uploadError" type="error">
                上传失败: {{ uploadError }}
              </n-text>
            </n-space>
          </n-space>
        </n-form-item>

        <n-form-item label="名字" required>
          <n-input v-model:value="petStore.petFormModal.data.name" placeholder="输入宠物的名字" />
        </n-form-item>

        <n-form-item label="生日">
          <n-date-picker
            v-model:value="petStore.petFormModal.data.birthday"
            type="date"
            value-format="yyyy-MM-dd"
            style="width: 100%;"
          />
        </n-form-item>

        <n-form-item label="物种" required>
          <n-select
            v-model:value="petStore.petFormModal.data.speciesId"
            :options="speciesOptions"
            placeholder="请选择物种"
          />
        </n-form-item>

        <n-form-item label="品种">
          <n-select
            v-model:value="petStore.petFormModal.data.breedId"
            :options="breedOptions"
            :disabled="!petStore.petFormModal.data.speciesId"
            placeholder="请先选择物种"
            clearable
          />
        </n-form-item>
      </n-form>
    </div>
     <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="petStore.petFormModal.loading">
          保存
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
