<script setup>
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePetStore } from '@/stores/petStore';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage';
import { useCloudinaryUpload } from '@/composables/useCloudinaryUpload';
import { getPetGalleryDetail } from '@/api.js';
import {
  NCard,
  NSpin,
  NEmpty,
  NModal,
  NText,
  NButton,
  NIcon,
  NSelect,
  NSpace,
  useMessage,
  NInput,
  NBadge
} from 'naive-ui';
import { Add, ImageOutline, CloseOutline } from '@vicons/ionicons5';

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

function closeLightbox() {
  showFullImageModal.value = false;
  fullImageUrl.value = '';
  fullImageDescription.value = '';
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
  uploadTargetPetId.value = null;
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
        publicId: publicId,
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
  <div class="pet-album-page">
    <!-- 页面标题 -->
    <div class="album-header">
      <h2 class="album-title">
        <n-icon :component="ImageOutline" size="28" color="#FF9BA8" />
        萌宠相册
      </h2>
      <p class="album-subtitle">记录萌宠的每一个可爱瞬间</p>
    </div>

    <n-card class="album-card">
      <!-- 添加图片按钮 -->
      <n-button
        strong
        secondary
        circle
        type="primary"
        class="add-button"
        @click="handleAddClick"
        :loading="isUploading"
        size="large"
      >
        <template #icon>
          <n-icon size="24"><Add /></n-icon>
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
                alt="宠物相册"
              />
              <div class="image-overlay">
                <n-icon v-if="image.description" :component="ImageOutline" size="20" />
              </div>
              <n-text v-if="image.description" class="description">{{ image.description }}</n-text>
            </div>
          </div>
        </div>
        <n-empty v-else description="相册里还没有照片，快去添加吧～" class="empty-state">
          <template #icon>
            <span style="font-size: 64px;">📷</span>
          </template>
        </n-empty>
      </n-spin>
    </n-card>

    <!-- 选择宠物弹窗 -->
    <n-modal
      v-model:show="showSelectPetModal"
      preset="card"
      style="width: 450px"
      title="选择萌宠"
      :mask-closable="false"
      class="pet-select-modal"
    >
      <n-space vertical :size="16">
        <n-text depth="3">这张照片属于哪个小可爱？</n-text>
        <n-select
          v-model:value="uploadTargetPetId"
          placeholder="选择宠物"
          :options="petOptions"
          :loading="loadingList"
          size="large"
        />
        <n-button
          type="primary"
          block
          @click="handlePetSelected"
          :disabled="!uploadTargetPetId || isUploading"
          :loading="isUploading"
          class="next-btn"
        >
          下一步：上传图片
        </n-button>
      </n-space>
    </n-modal>

    <!-- 添加描述弹窗 -->
    <n-modal
      v-model:show="showDescriptionModal"
      preset="card"
      style="width: 450px"
      title="为图片添加描述"
      :mask-closable="false"
      class="description-modal"
    >
      <n-space vertical :size="16">
        <n-input
          v-model:value="imageDescription"
          placeholder="输入图片描述..."
          type="textarea"
          :rows="3"
          @keydown.enter.ctrl="handleConfirmDescription"
        />
        <n-button
          type="primary"
          block
          @click="handleConfirmDescription"
          class="confirm-btn"
        >
          确认添加
        </n-button>
      </n-space>
    </n-modal>

    <!-- 全屏图片查看弹窗 -->
    <n-modal
      v-model:show="showFullImageModal"
      preset="card"
      style="width: 95vw; max-width: 1400px; height: 90vh; background: rgba(20, 20, 20, 0.95);"
      content-style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 0; position: relative;"
      :bordered="false"
      :closable="false"
      :on-after-leave="closeLightbox"
    >
      <!-- 关闭按钮 -->
      <n-button
        circle
        size="large"
        class="lightbox-close-btn"
        @click="closeLightbox"
      >
        <template #icon>
          <n-icon size="24"><CloseOutline /></n-icon>
        </template>
      </n-button>

      <n-spin :show="lightboxLoading" size="large">
        <img
          :src="fullImageUrl"
          class="lightbox-image"
          alt="全屏查看"
        />
      </n-spin>

      <div v-if="fullImageDescription" class="lightbox-description">
        <n-text class="lightbox-description-text">
          {{ fullImageDescription }}
        </n-text>
      </div>
    </n-modal>
  </div>
</template>

<style scoped>
.pet-album-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面头部 */
.album-header {
  text-align: center;
  margin-bottom: 24px;
}

.album-title {
  font-size: 28px;
  font-weight: 700;
  color: #2D2D2D;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.album-subtitle {
  color: #9CA3AF;
  font-size: 14px;
}

/* 相册卡片 */
.album-card {
  border-radius: 20px;
  position: relative;
  min-height: 400px;
}

/* 添加按钮 */
.add-button {
  position: fixed;
  top: 100px;
  right: 40px;
  z-index: 10;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%) !important;
  border: none;
  box-shadow: 0 4px 20px rgba(255, 155, 168, 0.4);
  transition: all 0.3s ease;
}

.add-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(255, 155, 168, 0.5);
}

/* 瀑布流布局 */
.masonry-grid {
  column-count: 4;
  column-gap: 16px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 16px;
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.masonry-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(255, 155, 168, 0.2);
}

.masonry-item .masonry-image {
  width: 100%;
  display: block;
  transition: transform 0.3s ease;
}

.masonry-item:hover .masonry-image {
  transform: scale(1.05);
}

/* 图片遮罩 */
.image-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.masonry-item:hover .image-overlay {
  opacity: 1;
}

/* 描述文字 */
.masonry-item .description {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
  color: white;
  padding: 30px 12px 12px 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 14px;
}

.masonry-item:hover .description {
  opacity: 1;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
}

/* 弹窗按钮样式 */
.next-btn, .confirm-btn {
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%) !important;
  border: none;
  border-radius: 12px;
  height: 44px;
  font-weight: 600;
}

/* 全屏查看 */
.lightbox-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.2) !important;
  border: none;
  color: white !important;
}

.lightbox-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.lightbox-description {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 10;
  pointer-events: none;
}

.lightbox-description-text {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 16px;
  display: inline-block;
}

/* 响应式 */
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
    bottom: 24px;
    right: 24px;
  }

  .album-title {
    font-size: 22px;
  }
}

@media (max-width: 576px) {
  .masonry-grid {
    column-count: 1;
  }
}
</style>
