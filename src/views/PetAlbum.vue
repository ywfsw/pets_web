<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { usePetStore } from '@/stores/petStore';
import { useAuthStore } from '@/stores/authStore';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage';
import { useCloudinaryUpload } from '@/composables/useCloudinaryUpload';
import { getPetGalleryDetail, updatePetGalleryImage } from '@/api.js';
import {
  NModal,
  NButton,
  NIcon,
  NSelect,
  NSpace,
  NSpin,
  NText,
  useMessage,
  NInput,
} from 'naive-ui';
import PetAvatarSelector from '@/components/PetAvatarSelector.vue';
import { Add, ImageOutline, CloseOutline, TrashOutline, CreateOutline, CheckmarkOutline, PawOutline, ChevronBackOutline, ChevronForwardOutline } from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();
const { petGallery, loadingGallery, petList, loadingList, albumFilterPetId, albumFilterPetName } = storeToRefs(petStore);
const { getFullResolutionUrl, getGalleryThumbnailUrl } = useCloudinaryImage();
const { openUploadWidget, isUploading } = useCloudinaryUpload();
const message = useMessage();

const mounted = ref(false);
onMounted(() => {
  nextTick(() => { mounted.value = true; });
});

// 统计信息
const photoCount = computed(() => petGallery.value.length);
const petCount = computed(() => {
  const petIds = new Set(petGallery.value.map(img => img.petId));
  return petIds.size;
});

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
const currentImageIndex = ref(-1);

// 灯箱导航
const hasPrevImage = computed(() => currentImageIndex.value > 0);
const hasNextImage = computed(() => currentImageIndex.value < petGallery.value.length - 1);

function navigatePrev() {
  if (!hasPrevImage.value) return;
  const prevIndex = currentImageIndex.value - 1;
  showFullImageByIndex(prevIndex);
}

function navigateNext() {
  if (!hasNextImage.value) return;
  const nextIndex = currentImageIndex.value + 1;
  showFullImageByIndex(nextIndex);
}

async function showFullImageByIndex(index) {
  const image = petGallery.value[index];
  if (!image) return;
  currentImageIndex.value = index;
  currentImage.value = image;
  fullImageUrl.value = getFullResolutionUrl(image.imageUrl);
  fullImageDescription.value = '';
  lightboxLoading.value = true;

  try {
    const response = await getPetGalleryDetail(image.id);
    fullImageDescription.value = response.data.description;
  } catch (err) {
    console.error("获取图片详情失败:", err);
  } finally {
    lightboxLoading.value = false;
  }
}

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
  window.addEventListener('keydown', handleLightboxKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleLightboxKeydown);
});

// 监听筛选变化
watch(albumFilterPetId, () => {
  loadGalleryData();
});

// --- Lightbox Logic ---
async function showFullImage(image) {
  const index = petGallery.value.findIndex(img => img.id === image.id);
  currentImageIndex.value = index >= 0 ? index : 0;
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
  currentImageIndex.value = -1;
  isEditingDescription.value = false;
  editingDescriptionText.value = '';
}

// 键盘导航
function handleLightboxKeydown(e) {
  if (!showFullImageModal.value) return;
  if (e.key === 'ArrowLeft') navigatePrev();
  else if (e.key === 'ArrowRight') navigateNext();
  else if (e.key === 'Escape') closeLightbox();
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
  <div class="pet-album-page" :class="{ 'is-mounted': mounted }">
    <!-- 沉浸式 Hero 头部 -->
    <div class="album-hero">
      <div class="hero-gradient-frame">
        <div class="hero-inner">
          <div class="hero-decorations">
            <span class="hero-shape shape-1">🌸</span>
            <span class="hero-shape shape-2">🐾</span>
            <span class="hero-shape shape-3">✨</span>
            <span class="hero-shape shape-4">🦋</span>
            <span class="hero-shape shape-5">💫</span>
          </div>
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="hero-title-icon">📸</span>
              <span class="hero-title-text">萌宠相册</span>
            </h1>
            <p class="hero-subtitle">记录萌宠的每一个可爱瞬间</p>
          </div>
          <div class="hero-stats-bar">
            <div class="hero-stat">
              <span class="hero-stat-icon">📸</span>
              <span class="hero-stat-value">{{ photoCount }}</span>
              <span class="hero-stat-label">张照片</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">🐾</span>
              <span class="hero-stat-value">{{ petCount }}</span>
              <span class="hero-stat-label">只萌宠</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 宠物头像选择器 -->
    <div class="pet-selector-section section-entrance" style="--entrance-delay: 0.1s;">
      <PetAvatarSelector
        v-if="petList.length >= 2"
        :pets="petList"
        :selected-id="albumFilterPetId"
        :show-all="true"
        all-label="全部照片"
        @select="handleFilterChange"
      />
    </div>

    <!-- 工具栏：上传 -->
    <div class="album-toolbar section-entrance" style="--entrance-delay: 0.12s;">
      <div v-if="albumFilterPetId" class="selected-pet-hint">
        🐾 正在查看: {{ albumFilterPetName || '未知宠物' }} 的照片
      </div>
      <div v-else class="all-pets-hint">
        📸 查看全部照片
      </div>
      <n-button
        type="primary"
        class="upload-btn"
        @click="handleAddClick"
        :loading="isUploading"
        :disabled="!authStore.isAuthenticated"
      >
        <template #icon>
          <n-icon :component="Add" />
        </template>
        上传照片
      </n-button>
    </div>

    <!-- 加载骨架屏 -->
    <div v-if="loadingGallery" class="skeleton-grid section-entrance" style="--entrance-delay: 0.2s;">
      <div v-for="i in 8" :key="i" class="skeleton-card">
        <div class="skeleton-image" />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="petGallery.length === 0" class="empty-state section-entrance" style="--entrance-delay: 0.2s;">
      <div class="empty-icon-wrap">
        <span class="empty-icon-emoji">📷</span>
        <span class="empty-icon-sparkle">✨</span>
      </div>
      <p class="empty-title">{{ albumFilterPetId ? `${albumFilterPetName || '这只宠物'}还没有照片哦～` : '相册里还没有照片' }}</p>
      <p class="empty-desc">快去上传第一张萌宠照片吧</p>
      <n-button
        v-if="authStore.isAuthenticated && petStore.petList.length > 0"
        type="primary"
        size="medium"
        class="upload-btn"
        @click="handleAddClick"
      >
        <template #icon>
          <n-icon :component="Add" />
        </template>
        上传第一张照片
      </n-button>
    </div>

    <!-- 照片网格 -->
    <div v-else class="gallery-section section-entrance" style="--entrance-delay: 0.2s;">
      <div class="masonry-grid">
        <div
          v-for="(image, index) in petGallery"
          :key="image.id"
          class="masonry-item"
          :style="{ '--item-delay': `${Math.min(index * 50, 600)}ms` }"
          @click="showFullImage(image)"
        >
          <img
            :src="getGalleryThumbnailUrl(image.imageUrl)"
            class="masonry-image"
            loading="lazy"
            alt="宠物相册"
          />
          <div class="image-overlay">
            <div class="overlay-actions">
              <n-icon :component="ImageOutline" size="22" />
            </div>
          </div>
          <div v-if="!albumFilterPetId && getPetName(image.petId)" class="pet-name-tag">
            <n-icon :component="PawOutline" size="12" />
            {{ getPetName(image.petId) }}
          </div>
          <span v-if="image.description" class="image-description">{{ image.description }}</span>
        </div>
      </div>
    </div>

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
      style="width: 95vw; max-width: 1400px; height: 90vh; background: rgba(15, 15, 20, 0.97);"
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

      <!-- 左箭头 -->
      <button
        v-if="hasPrevImage"
        class="lightbox-nav-btn lightbox-nav-prev"
        @click="navigatePrev"
        title="上一张 (←)"
      >
        <n-icon :component="ChevronBackOutline" size="32" />
      </button>

      <!-- 右箭头 -->
      <button
        v-if="hasNextImage"
        class="lightbox-nav-btn lightbox-nav-next"
        @click="navigateNext"
        title="下一张 (→)"
      >
        <n-icon :component="ChevronForwardOutline" size="32" />
      </button>

      <!-- 计数器 -->
      <div v-if="petGallery.length > 1" class="lightbox-counter">
        {{ currentImageIndex + 1 }} / {{ petGallery.length }}
      </div>

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

/* ===== Immersive Hero ===== */
.album-hero {
  margin-bottom: 24px;
}

.hero-gradient-frame {
  border-radius: 24px;
  padding: 3px;
  background: linear-gradient(135deg, #EC4899 0%, #F472B6 30%, #FB7185 60%, #FDA4AF 100%);
  box-shadow: 0 8px 32px rgba(236, 72, 153, 0.2);
}

.hero-inner {
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 241, 244, 0.92) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 36px 32px 28px;
  position: relative;
  overflow: hidden;
}

:root[data-theme="dark"] .hero-gradient-frame {
  box-shadow: 0 8px 32px rgba(236, 72, 153, 0.12);
}

:root[data-theme="dark"] .hero-inner {
  background: linear-gradient(135deg, rgba(30, 20, 28, 0.95) 0%, rgba(40, 20, 30, 0.92) 100%);
}

/* Floating decorations */
.hero-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-shape {
  position: absolute;
  font-size: 20px;
  opacity: 0.35;
  animation: hero-float 6s ease-in-out infinite;
}

:root[data-theme="dark"] .hero-shape {
  opacity: 0.25;
}

.shape-1 { top: 12%; left: 8%; animation-delay: 0s; font-size: 22px; }
.shape-2 { top: 20%; right: 12%; animation-delay: 1.2s; }
.shape-3 { bottom: 25%; left: 18%; animation-delay: 2.4s; font-size: 16px; }
.shape-4 { top: 15%; right: 30%; animation-delay: 0.8s; font-size: 18px; }
.shape-5 { bottom: 20%; right: 8%; animation-delay: 3s; }

@keyframes hero-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(5deg); }
  50% { transform: translateY(-14px) rotate(-3deg); }
  75% { transform: translateY(-6px) rotate(2deg); }
}

.hero-content {
  text-align: center;
  position: relative;
  z-index: 1;
  margin-bottom: 24px;
}

.hero-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #BE185D 0%, #DB2777 50%, #EC4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:root[data-theme="dark"] .hero-title {
  background: linear-gradient(135deg, #F9A8D4 0%, #F472B6 50%, #FB7185 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hero-title-icon {
  font-size: 36px;
  -webkit-text-fill-color: initial;
  animation: gentle-bounce 3s ease-in-out infinite;
}

@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.hero-subtitle {
  margin: 0;
  font-size: 15px;
  color: #BE185D;
  font-weight: 500;
}

:root[data-theme="dark"] .hero-subtitle {
  color: #F9A8D4;
}

/* Hero Stats Bar */
.hero-stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(236, 72, 153, 0.15);
  position: relative;
  z-index: 1;
}

:root[data-theme="dark"] .hero-stats-bar {
  background: rgba(40, 20, 30, 0.5);
  border-color: rgba(244, 114, 182, 0.1);
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-stat-icon {
  font-size: 18px;
}

.hero-stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #BE185D;
  line-height: 1;
}

:root[data-theme="dark"] .hero-stat-value {
  color: #F9A8D4;
}

.hero-stat-label {
  font-size: 12px;
  color: #BE185D;
  font-weight: 500;
}

:root[data-theme="dark"] .hero-stat-label {
  color: #F9A8D4;
}

.hero-stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(236, 72, 153, 0.15);
}

:root[data-theme="dark"] .hero-stat-divider {
  background: rgba(244, 114, 182, 0.15);
}

/* ===== Section Entrance Animation ===== */
.section-entrance {
  opacity: 0;
  transform: translateY(20px);
}

.is-mounted .section-entrance {
  animation: section-rise 0.5s ease forwards;
  animation-delay: var(--entrance-delay, 0s);
}

@keyframes section-rise {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Pet Selector ===== */
.pet-selector-section {
  margin-bottom: 16px;
}

/* ===== Toolbar ===== */
.album-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.selected-pet-hint,
.all-pets-hint {
  font-size: 14px;
  color: var(--pet-text-secondary, #6B7280);
  font-weight: 500;
  padding: 6px 14px;
  background: rgba(236, 72, 153, 0.06);
  border-radius: 10px;
  border: 1px solid rgba(236, 72, 153, 0.12);
}

:root[data-theme="dark"] .selected-pet-hint,
:root[data-theme="dark"] .all-pets-hint {
  background: rgba(244, 114, 182, 0.08);
  border-color: rgba(244, 114, 182, 0.15);
  color: rgba(255, 255, 255, 0.7);
}

.upload-btn {
  background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
}

/* ===== Skeleton Loading ===== */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-card {
  border-radius: 16px;
  overflow: hidden;
  background: var(--pet-card, #fff);
  border: 1px solid var(--pet-border, #F0E6E0);
}

:root[data-theme="dark"] .skeleton-card {
  background: rgba(30, 20, 28, 0.6);
  border-color: rgba(244, 114, 182, 0.08);
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 4/3;
  background: linear-gradient(90deg, var(--pet-border, #f0f0f0) 25%, rgba(255, 255, 255, 0.5) 50%, var(--pet-border, #f0f0f0) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

:root[data-theme="dark"] .skeleton-image {
  background: linear-gradient(90deg, rgba(60, 40, 55, 0.6) 25%, rgba(80, 50, 70, 0.4) 50%, rgba(60, 40, 55, 0.6) 75%);
  background-size: 200% 100%;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== Empty State ===== */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.empty-icon-emoji {
  font-size: 64px;
  display: block;
  animation: empty-float 3s ease-in-out infinite;
}

@keyframes empty-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-icon-sparkle {
  position: absolute;
  top: -4px;
  right: -8px;
  font-size: 20px;
  animation: sparkle-blink 2s ease-in-out infinite;
}

@keyframes sparkle-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.8); }
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--pet-text, #2D2D2D);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--pet-text-secondary, #9CA3AF);
  margin: 0 0 24px;
}

:root[data-theme="dark"] .empty-title { color: #E8E8E8; }
:root[data-theme="dark"] .empty-desc { color: #888; }

/* ===== Masonry Grid ===== */
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
  animation: item-slide-in 0.4s ease both;
  animation-delay: var(--item-delay, 0s);
}

@keyframes item-slide-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.masonry-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(236, 72, 153, 0.18);
}

.masonry-item .masonry-image {
  width: 100%;
  display: block;
  transition: transform 0.35s ease;
}

.masonry-item:hover .masonry-image {
  transform: scale(1.05);
}

/* Image overlay */
.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 10px;
}

.masonry-item:hover .image-overlay {
  opacity: 1;
}

.overlay-actions {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: #EC4899;
}

:root[data-theme="dark"] .overlay-actions {
  background: rgba(40, 20, 30, 0.92);
  color: #F472B6;
}

/* Pet name tag */
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

:root[data-theme="dark"] .pet-name-tag {
  background: rgba(40, 20, 30, 0.92);
  color: #E8E8E8;
}

/* Description overlay */
.image-description {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
  color: white;
  padding: 30px 12px 12px 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 13px;
  line-height: 1.4;
}

.masonry-item:hover .image-description {
  opacity: 1;
}

/* ===== Modal Buttons ===== */
.next-btn, .confirm-btn {
  background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  height: 44px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.25);
}

/* ===== Lightbox ===== */
.lightbox-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white !important;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.lightbox-close-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
}

.lightbox-delete-btn {
  position: absolute;
  top: 20px;
  right: 80px;
  z-index: 100;
  background: rgba(239, 68, 68, 0.5) !important;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: white !important;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.lightbox-delete-btn:hover {
  background: rgba(239, 68, 68, 0.8) !important;
}

.lightbox-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Lightbox navigation */
.lightbox-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.lightbox-nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-50%) scale(1.05);
}

.lightbox-nav-prev { left: 20px; }
.lightbox-nav-next { right: 20px; }

.lightbox-counter {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

/* Lightbox description */
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
  font-size: 15px;
  display: inline-block;
  backdrop-filter: blur(8px);
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

/* ===== Responsive ===== */
@media (max-width: 1200px) {
  .masonry-grid, .skeleton-grid {
    column-count: 3;
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-gradient-frame { border-radius: 18px; }
  .hero-inner { padding: 28px 20px 22px; }
  .hero-title { font-size: 26px; }
  .hero-title-icon { font-size: 30px; }
  .hero-subtitle { font-size: 13px; }
  .hero-stats-bar { gap: 14px; padding: 12px 16px; }
  .hero-stat-value { font-size: 20px; }

  .pet-selector-section { margin-bottom: 12px; }

  .album-toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .selected-pet-hint,
  .all-pets-hint { text-align: center; }

  .masonry-grid, .skeleton-grid {
    column-count: 2;
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .hero-inner { padding: 22px 16px 18px; }
  .hero-title { font-size: 22px; gap: 8px; }
  .hero-title-icon { font-size: 26px; }
  .hero-stats-bar { gap: 10px; padding: 10px 12px; }
  .hero-stat-value { font-size: 18px; }
  .hero-stat-label { font-size: 11px; }
  .hero-stat-icon { font-size: 14px; }

  .masonry-grid, .skeleton-grid {
    column-count: 2;
    grid-template-columns: repeat(2, 1fr);
    column-gap: 10px;
  }

  .masonry-item { margin-bottom: 10px; border-radius: 12px; }
}
</style>
