<script setup>
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePetStore } from '@/stores/petStore';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage';
import { useCloudinaryUpload } from '@/composables/useCloudinaryUpload';
import { getPetGalleryDetail } from '@/api.js';
import { NCard, NSpin, NEmpty, NModal, NText, NButton, NIcon, NSelect, NSpace, useMessage, NInput } from 'naive-ui';
import { Add } from '@vicons/ionicons5';

const petStore = usePetStore();
const { petGallery, loadingGallery, petList, loadingList } = storeToRefs(petStore);
const { getFullResolutionUrl, getGalleryThumbnailUrl } = useCloudinaryImage();
const { openUploadWidget, isUploading } = useCloudinaryUpload();
const message = useMessage();


// --- Lightbox Modal State ---
const showFullImageModal = ref(false);
const fullImageUrl = ref('');
const fullImageDescription = ref('');
const lightboxLoading = ref(false);

onMounted(() => {
  petStore.loadAllPetGallery();
  if (petList.value.length === 0) {
    petStore.loadPetList();
  }
});

// --- Lightbox Logic ---
async function showFullImage(image) {
  fullImageUrl.value = getFullResolutionUrl(image.imageUrl);
  fullImageDescription.value = '';
  showFullImageModal.value = true;
  lightboxLoading.value = true;

  try {
    const response = await getPetGalleryDetail(image.id);
    fullImageDescription.value = response.data.description;
  } catch (err) {
    console.error("获取图片详情失败:", err);
    message.error('加载图片描述失败');
  } finally {
    lightboxLoading.value = false;
  }
}

// --- Upload Logic ---
const showSelectPetModal = ref(false);
const showDescriptionModal = ref(false);
const newImageData = ref(null);
const imageDescription = ref('');
const uploadTargetPetId = ref(null);

const petOptions = computed(() =>
  petList.value.map(pet => ({
    label: pet.name,
    value: pet.id
  }))
);

function handleAddClick() {
  uploadTargetPetId.value = null; // Reset selection
  showSelectPetModal.value = true;
}

function handlePetSelected() {
  if (!uploadTargetPetId.value) {
    message.error('请选择一个宠物');
    return;
  }
  showSelectPetModal.value = false;
  openUploadWidget(
    {
      folder: 'pet-gallery',
      tags: ['gallery', `pet-${uploadTargetPetId.value}`]
    },
    ({ url, publicId }) => {
      newImageData.value = {
        petId: uploadTargetPetId.value,
        imageUrl: url,
        publicId: publicId, // Also save publicId
        description: ''
      };
      showDescriptionModal.value = true;
    }
  );
}

async function handleConfirmDescription() {
  if (!newImageData.value) return;
  newImageData.value.description = imageDescription.value;

  try {
    await petStore.addPetGallery(newImageData.value);
    message.success('图片添加成功');
  } catch (error) {
    console.error('添加图片失败:', error);
    message.error('添加图片失败');
  } finally {
    showDescriptionModal.value = false;
    imageDescription.value = '';
    newImageData.value = null;
  }
}

</script>

<template>
  <n-card title="所有宠物图片">
    <!-- Add Image FAB -->
    <n-button
      strong
      secondary
      circle
      type="primary"
      class="add-button"
      @click="handleAddClick"
      :loading="isUploading"
    >
      <template #icon>
        <n-icon><Add /></n-icon>
      </template>
    </n-button>

    <n-spin :show="loadingGallery">
      <div v-if="petGallery.length > 0">
        <div class="masonry-grid">
          <div
            v-for="image in petGallery"
            :key="image.id"
            class="masonry-item"
            @click="showFullImage(image)"
          >
            <img
              :src="getGalleryThumbnailUrl(image.imageUrl)"
              class="masonry-image"
              loading="lazy"
            />
            <n-text v-if="image.description" class="description">{{ image.description }}</n-text>
          </div>
        </div>
      </div>
      <n-empty v-else description="相册里还没有照片" style="margin-top: 24px;" />
    </n-spin>

    <!-- Select Pet Modal -->
    <n-modal
      v-model:show="showSelectPetModal"
      preset="card"
      style="width: 500px"
      title="选择一个宠物"
      :mask-closable="false"
    >
      <n-space vertical>
        <n-select
          v-model:value="uploadTargetPetId"
          placeholder="这张照片属于哪个小可爱？"
          :options="petOptions"
          :loading="loadingList"
        />
        <n-button
          type="primary"
          @click="handlePetSelected"
          :disabled="!uploadTargetPetId || isUploading"
          :loading="isUploading"
        >
          下一步：上传图片
        </n-button>
      </n-space>
    </n-modal>

    <!-- Add Description Modal -->
    <n-modal
        v-model:show="showDescriptionModal"
        preset="card"
        style="width: 500px"
        title="为图片添加描述"
        :mask-closable="false"
      >
        <n-space vertical>
          <n-input v-model:value="imageDescription" placeholder="输入图片描述..." @keydown.enter="handleConfirmDescription"/>
          <n-button type="primary" @click="handleConfirmDescription">确认</n-button>
        </n-space>
      </n-modal>

    <!-- Full Image Lightbox Modal -->
    <n-modal
      v-model:show="showFullImageModal"
      preset="card"
      style="width: 90vw; max-width: 1200px; height: 90vh; background: rgba(0, 0, 0, 0.8);"
      content-style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 0;"
      :bordered="false"
      :on-after-leave="() => { fullImageUrl = ''; fullImageDescription = ''; }"
    >
      <n-spin :show="lightboxLoading" size="large">
        <img
          :src="fullImageUrl"
          style="max-width: 100%; max-height: 100%; object-fit: contain;"
        />
      </n-spin>
      <template #footer>
        <div style="text-align: center;">
          <n-text v-if="fullImageDescription" style="color: white; font-size: 16px;">
            {{ fullImageDescription }}
          </n-text>
        </div>
      </template>
    </n-modal>
  </n-card>
</template>

<style scoped>
.add-button {
  position: fixed;
  top: 84px;
  right: 40px;
  z-index: 10;
  width: 50px;
  height: 50px;
}

.masonry-grid {
  column-count: 4;
  column-gap: 12px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 12px;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.masonry-item .masonry-image {
  width: 100%;
  display: block;
}

.masonry-item .description {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
  color: white;
  padding: 20px 10px 10px 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 14px;
}
.masonry-item:hover .description {
  opacity: 1;
}

.lightbox-description {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  max-width: 80%;
  text-align: center;
  font-size: 16px;
  z-index: 1;
  pointer-events: none;
}

/* Responsive Columns */
@media (max-width: 1200px) {
  .masonry-grid {
    column-count: 3;
  }
}
@media (max-width: 768px) {
  .masonry-grid {
    column-count: 2;
  }
  .add-button {
    top: auto;
    bottom: 20px;
    right: 20px;
  }
}
@media (max-width: 576px) {
  .masonry-grid {
    column-count: 1;
  }
}
</style>
