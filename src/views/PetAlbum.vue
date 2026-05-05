<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePetStore } from '@/stores/petStore';
import { useAuthStore } from '@/stores/authStore';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage';
import { useCloudinaryUpload } from '@/composables/useCloudinaryUpload';
import { getPetGalleryDetail, updatePetGalleryImage } from '@/api.js';
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
  NTag
} from 'naive-ui';
import { Add, ImageOutline, CloseOutline, TrashOutline, CreateOutline, CheckmarkOutline, PawOutline } from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();
const { petGallery, loadingGallery, petList, loadingList, albumFilterPetId, albumFilterPetName } = storeToRefs(petStore);
const { getFullResolutionUrl, getGalleryThumbnailUrl } = useCloudinaryImage();
const { openUploadWidget, isUploading } = useCloudinaryUpload();
const message = useMessage();

// 根据 petId 获取宠物名称
function getPetName(petId) {
  const pet = petList.value.find(p => p.id === petId);
  return pet ? pet.name : '';
}

// --- Lightbox Modal State ---
const showFullImageModal = ref(false);
const fullImageUrl = ref('');
const fullImageDescription = ref('');
const lightboxLoading = ref(false);
const currentImage = ref(null);

// 下拉筛选器处理
function handleFilterChange(petId) {
  if (petId) {
    const pet = petList.value.find(p => p.id === petId);
    petStore.navigateToAlbum(petId, pet?.name || '');
  } else {
    petStore.clearAlbumFilter();
  }
}

// 根据筛选加载相册
function loadGalleryData() {
  if (albumFilterPetId.value) {
    petStore.loadPetGalleryByPetId(albumFilterPetId.value);
  } else {
    petStore.loadAllPetGallery();
  }
}

onMounted(() => {
  loadGalleryData();
  if (petList.value.length === 0) {
    petStore.loadPetList();
  }
});

// 监听筛选变化
watch(albumFilterPetId, () => {
  loadGalleryData();
});

// --- Lightbox Logic ---
async function showFullImage(image) {
  currentImage.value = image;
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
  currentImage.value = null;
  isEditingDescription.value = false;
  editingDescriptionText.value = '';
}

// --- Edit Description Logic ---
const isEditingDescription = ref(false);
const editingDescriptionText = ref('');
const savingDescription = ref(false);

function startEditDescription() {
  editingDescriptionText.value = fullImageDescription.value || '';
  isEditingDescription.value = true;
}

function cancelEditDescription() {
  isEditingDescription.value = false;
  editingDescriptionText.value = '';
}

async function saveDescription() {
  if (!currentImage.value) return;
  savingDescription.value = true;
  try {
    await updatePetGalleryImage(currentImage.value.id, {
      id: currentImage.value.id,
      petId: currentImage.value.petId,
      imageUrl: currentImage.value.imageUrl,
      publicId: currentImage.value.publicId,
      description: editingDescriptionText.value
    });
    fullImageDescription.value = editingDescriptionText.value;
    isEditingDescription.value = false;
    message.success('描述已更新');
    loadGalleryData();
  } catch (err) {
    console.error('更新描述失败:', err);
    message.error('更新失败，请重试');
  } finally {
    savingDescription.value = false;
  }
}

// --- Delete Image Logic ---
async function handleDeleteImage() {
  if (!currentImage.value) return;

  try {
    await petStore.deletePetGallery(currentImage.value.id);
    message.success('删除成功');
    closeLightbox();
  } catch (err) {
    console.error('删除图片失败:', err);
    message.error('删除失败，请重试');
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

// 筛选下拉选项：包含当前筛选的宠物（可能不在列表中）+ 全部宠物列表
const filterPetOptions = computed(() => {
  const options = petList.value.map(pet => ({
    label: pet.name,
    value: pet.id
  }));
  // 如果当前筛选的宠物不在列表中，添加它
  if (albumFilterPetId.value && !options.find(o => o.value === albumFilterPetId.value)) {
    options.unshift({
      label: albumFilterPetName.value || '未知宠物',
      value: albumFilterPetId.value
    });
  }
  return options;
});

function handleAddClick() {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再添加照片');
    return;
  }
  // 如果已筛选宠物，直接使用该宠物
  if (albumFilterPetId.value) {
    uploadTargetPetId.value = albumFilterPetId.value;
    openUploadWidget(
      {
        folder: 'pet-gallery',
        tags: ['gallery', `pet-${albumFilterPetId.value}`]
      },
      ({ url, publicId }) => {
        newImageData.value = {
          petId: albumFilterPetId.value,
          imageUrl: url,
          publicId: publicId,
          description: ''
        };
        showDescriptionModal.value = true;
      }
    );
    return;
  }
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
      <div class="album-header-top">
        <h2 class="album-title">
          <n-icon :component="ImageOutline" size="28" color="#FF9BA8" />
          萌宠相册
        </h2>
        <n-select
          :value="albumFilterPetId"
          :options="filterPetOptions"
          placeholder="按宠物筛选"
          clearable
          size="medium"
          class="album-pet-filter"
          @update:value="handleFilterChange"
        />
      </div>
      <p class="album-subtitle">记录萌宠的每一个可爱瞬间</p>
    </div>

    <!-- 宠物筛选标签 -->
    <div v-if="albumFilterPetId" class="filter-bar">
      <n-tag closable type="primary" round size="medium" @close="petStore.clearAlbumFilter()">
        <template #icon>
          <n-icon :component="PawOutline" size="14" />
        </template>
        正在查看: {{ albumFilterPetName || '未知宠物' }}
      </n-tag>
      <n-button text type="default" size="small" @click="petStore.clearAlbumFilter()">
        查看全部
      </n-button>
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
              <div v-if="!albumFilterPetId && getPetName(image.petId)" class="pet-name-tag">
                <n-icon :component="PawOutline" size="12" />
                {{ getPetName(image.petId) }}
              </div>
              <n-text v-if="image.description" class="description">{{ image.description }}</n-text>
            </div>
          </div>
        </div>
        <n-empty v-else :description="albumFilterPetId ? `${albumFilterPetName || '这只宠物'}还没有照片哦～` : '相册里还没有照片，快去添加吧～'" class="empty-state">
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

      <!-- 删除按钮 -->
      <n-popconfirm
        v-if="authStore.isAuthenticated && currentImage"
        @positive-click="handleDeleteImage"
        :positive-button-props="{ type: 'error', size: 'small' }"
        :negative-button-props="{ size: 'small' }"
      >
        <template #trigger>
          <n-button
            circle
            size="large"
            class="lightbox-delete-btn"
          >
            <template #icon>
              <n-icon size="24"><TrashOutline /></n-icon>
            </template>
          </n-button>
        </template>
        确定要删除这张照片吗？此操作不可恢复。
      </n-popconfirm>

      <n-spin :show="lightboxLoading" size="large">
        <img
          :src="fullImageUrl"
          class="lightbox-image"
          alt="全屏查看"
        />
      </n-spin>

      <!-- 描述区域（查看/编辑模式） -->
      <div class="lightbox-description">
        <div v-if="isEditingDescription" class="description-edit-area">
          <n-input
            v-model:value="editingDescriptionText"
            type="textarea"
            placeholder="输入图片描述..."
            :rows="2"
            size="small"
            class="description-input"
            @keydown.enter.ctrl="saveDescription"
            @keydown.escape="cancelEditDescription"
          />
          <n-space :size="8">
            <n-button
              size="tiny"
              type="primary"
              :loading="savingDescription"
              @click="saveDescription"
            >
              <template #icon>
                <n-icon :component="CheckmarkOutline" />
              </template>
              保存
            </n-button>
            <n-button size="tiny" @click="cancelEditDescription">
              取消
            </n-button>
          </n-space>
        </div>
        <div v-else-if="fullImageDescription" class="description-view-area">
          <n-text class="lightbox-description-text">
            {{ fullImageDescription }}
          </n-text>
          <n-button
            v-if="authStore.isAuthenticated"
            text
            size="tiny"
            class="edit-desc-btn"
            @click="startEditDescription"
          >
            <template #icon>
              <n-icon :component="CreateOutline" size="14" />
            </template>
          </n-button>
        </div>
        <div v-else-if="authStore.isAuthenticated && currentImage" class="description-add-area">
          <n-button
            text
            size="tiny"
            class="add-desc-btn"
            @click="startEditDescription"
          >
            <template #icon>
              <n-icon :component="CreateOutline" size="14" />
            </template>
            添加描述
          </n-button>
        </div>
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

.album-header-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}

.album-title {
  font-size: 28px;
  font-weight: 700;
  color: #2D2D2D;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.album-pet-filter {
  width: 200px;
}

.album-subtitle {
  color: #9CA3AF;
  font-size: 14px;
  margin-top: 0;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 10px 16px;
  background: var(--pet-bg-secondary, #FFF5F7);
  border-radius: 12px;
  border: 1px solid var(--pet-border, #F0E6E0);
}

/* 相册卡片 */
.album-card {
  border-radius: 20px;
  position: relative;
  min-height: 400px;
  background: var(--pet-card);
  border: 1px solid var(--pet-border);
}

/* 添加按钮 */
.add-button {
  position: fixed;
  top: 100px;
  right: 40px;
  z-index: 10;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--pet-primary) 0%, var(--pet-primarySuppl) 100%) !important;
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

/* 宠物名称标签 */
.pet-name-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  color: #2D2D2D;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.masonry-item:hover .pet-name-tag {
  opacity: 1;
}

:global(.dark-mode) .pet-name-tag {
  background: rgba(40, 40, 70, 0.92);
  color: #E8E8E8;
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
  background: linear-gradient(135deg, var(--pet-primary) 0%, var(--pet-primarySuppl) 100%) !important;
  border: none !important;
  border-radius: 12px !important;
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

.lightbox-delete-btn {
  position: absolute;
  top: 20px;
  right: 80px;
  z-index: 100;
  background: rgba(239, 68, 68, 0.6) !important;
  border: none;
  color: white !important;
}

.lightbox-delete-btn:hover {
  background: rgba(239, 68, 68, 0.8) !important;
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

.description-view-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.edit-desc-btn {
  color: rgba(255, 255, 255, 0.7) !important;
  transition: color 0.2s ease;
}

.edit-desc-btn:hover {
  color: white !important;
}

.description-edit-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 90%;
  max-width: 500px;
}

.description-edit-area .description-input :deep(.n-input__textarea-el) {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.description-edit-area .description-input :deep(.n-input__textarea-el::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

.description-add-area {
  text-align: center;
}

.add-desc-btn {
  color: rgba(255, 255, 255, 0.6) !important;
  transition: color 0.2s ease;
}

.add-desc-btn:hover {
  color: white !important;
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

  .album-header-top {
    flex-direction: column;
    gap: 12px;
  }

  .album-pet-filter {
    width: 100%;
    max-width: 280px;
  }
}

@media (max-width: 576px) {
  .masonry-grid {
    column-count: 1;
  }
}
</style>
