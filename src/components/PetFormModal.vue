<script setup>
import { computed } from 'vue';

// (❗) 导入 Store
import { usePetStore } from '@/stores/petStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';

// (❗ 核心) 导入 Composable
import { useCloudinaryUpload } from '@/composables/useCloudinaryUpload.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';

const petStore = usePetStore();
const dictStore = useDictionaryStore();

// (❗ 核心) 使用 Composable
const { isUploading, uploadError, openUploadWidget } = useCloudinaryUpload();
const { getAvatarUrl } = useCloudinaryImage();

const filteredBreeds = computed(() => {
  if (!petStore.petFormModal.data) return [];
  const speciesId = petStore.petFormModal.data.speciesId;
  if (!speciesId) return [];
  return dictStore.breeds.filter(b => b.parentId === speciesId);
});

const handleSubmit = () => {
  // (❗) 提交时，数据已经包含 avatar URL 了
  petStore.handleSavePet();
};

/**
 * (❗ 核心) 上传图片处理器
 */
const handleImageUpload = () => {
  // 1. 调用 Composable 打开 Widget
  openUploadWidget(
    {
      folder: 'pet-avatars',
      tags: ['editing', petStore.petFormModal.data.id ? 'edit' : 'create']
    },
    ({ url, publicId }) => {
      // 2. (回调成功) 更新表单的本地数据
      // (注意: petFormModal.data 是响应式的，v-model 会自动更新)
      petStore.petFormModal.data.profileImageUrl = url;
      petStore.petFormModal.data.profileImagePublicId = publicId;
    }
  );
};
</script>

<template>
  <dialog :open="petStore.petFormModal.show" @click.self="petStore.closeAllPetModals()">
    <article
      v-if="petStore.petFormModal.data"
      :aria-busy="petStore.petFormModal.loading || isUploading"
    >
      <header>
        <a href="#" aria-label="Close" class="close" @click.prevent="petStore.closeAllPetModals()"></a>
        <strong>{{ petStore.petFormModal.isEdit ? '编辑宠物' : '创建新宠物' }}</strong>
      </header>

      <form @submit.prevent="handleSubmit">
        <label>宠物头像 (Avatar)</label>
        <div class="grid" style="grid-template-columns: 150px 1fr;">
          <figure v-if="petStore.petFormModal.data.profileImageUrl" class="avatar-container">
            <img :src="getAvatarUrl(petStore.petFormModal.data.profileImageUrl)" alt="Pet Avatar" class="pet-form-avatar">
          </figure>
          <figure v-else class="avatar-container pet-form-avatar-placeholder">
            <span>无头像</span>
          </figure>

          <div style="display: flex; flex-direction: column; justify-content: center; padding-left: 1rem;">
            <button
              type="button"
              @click="handleImageUpload"
              :aria-busy="isUploading"
              class="secondary"
              :disabled="isUploading"
            >
              {{ isUploading ? '上传中...' : (petStore.petFormModal.data.profileImageUrl ? '更换图片' : '上传图片') }}
            </button>
            <small v-if="uploadError" style="color: var(--pico-form-invalid-color); margin-top: 0.5rem;">
              上传失败: {{ uploadError }}
            </small>
          </div>
        </div>

        <hr>

        <label for="petName">名字</label>
        <input type="text" id="petName" v-model="petStore.petFormModal.data.name" required>

        <label for="petBday">生日</label>
        <input type="date" id="petBday" v-model="petStore.petFormModal.data.birthday">

        <label for="petSpecies">物种</label>
        <select id="petSpecies" v-model="petStore.petFormModal.data.speciesId" required>
          <option disabled :value="null">请选择物种</option>
          <option v-for="s in dictStore.species" :value="s.id" :key="s.id">{{ s.itemLabel }}</option>
        </select>

        <label for="petBreed">品种</label>
        <select id="petBreed" v-model="petStore.petFormModal.data.breedId">
          <option :value="null">请选择品种 (可选)</option>
          <option v-for="b in filteredBreeds" :value="b.id" :key="b.id">{{ b.itemLabel }}</option>
        </select>

        <footer>
          <button type="button" class="secondary" @click="petStore.closeAllPetModals()">取消</button>
          <button type="submit" :aria-busy="petStore.petFormModal.loading">保存</button>
        </footer>
      </form>
    </article>
  </dialog>
</template>

<style scoped>
.avatar-container {
  width: 150px;
  height: 150px;
  margin: 0 auto;
}

.pet-form-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.pet-form-avatar-placeholder {
  background: var(--pico-muted-color);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: white;
  font-weight: bold;
}
</style>
