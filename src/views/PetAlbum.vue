<script setup>
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePetStore } from '@/stores/petStore';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage';
import { NCard, NImage, NSpin, NEmpty, NModal, NText } from 'naive-ui';

const petStore = usePetStore();
const { petGallery, loadingGallery } = storeToRefs(petStore);
const { getFullResolutionUrl, getGalleryThumbnailUrl } = useCloudinaryImage();

// --- Lightbox Modal State ---
const showFullImageModal = ref(false);
const fullImageUrl = ref('');

onMounted(() => {
  petStore.loadAllPetGallery();
});

// --- Lightbox Logic ---
function showFullImage(imageUrl) {
  fullImageUrl.value = getFullResolutionUrl(imageUrl);
  showFullImageModal.value = true;
}

</script>

<template>
  <n-card title="所有宠物图片">
    <n-spin :show="loadingGallery">
      <div v-if="petGallery.length > 0">
        <div class="masonry-grid">
          <div
            v-for="image in petGallery"
            :key="image.id"
            class="masonry-item"
            @click="showFullImage(image.imageUrl)"
          >
            <n-image
              :src="getGalleryThumbnailUrl(image.imageUrl)"
              preview-disabled
              lazy
            />
            <n-text v-if="image.caption" class="caption">{{ image.caption }}</n-text>
          </div>
        </div>
      </div>
      <n-empty v-else description="相册里还没有照片" style="margin-top: 24px;" />
    </n-spin>

    <!-- Full Image Lightbox Modal -->
    <n-modal
      v-model:show="showFullImageModal"
      preset="card"
      style="width: 90vw; max-width: 1200px; height: 90vh;"
      content-style="display: flex; align-items: center; justify-content: center; height: 100%;"
      :bordered="false"
      :on-after-leave="() => fullImageUrl = ''"
    >
      <n-image :src="fullImageUrl" object-fit="contain" style="max-height: 100%; max-width: 100%;"/>
    </n-modal>
  </n-card>
</template>

<style scoped>
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

.masonry-item .caption {
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

.masonry-item:hover .caption {
  opacity: 1;
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
}

@media (max-width: 576px) {
  .masonry-grid {
    column-count: 1;
  }
}
</style>
