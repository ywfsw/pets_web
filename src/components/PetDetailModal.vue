<script setup>
import { ref, computed, watch } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import { useMessage } from 'naive-ui';
import {
  NModal,
  NSpace,
  NAvatar,
  NList,
  NListItem,
  NThing,
  NH4,
  NText,
  NSkeleton,
  NButton,
  NCard,
  NGrid,
  NGi,
  NIcon,
  NTag,
  NPopconfirm,
  NSpin,
  NEmpty
} from 'naive-ui';
import { ScaleOutline, HeartOutline, CalendarOutline, PawOutline, TrashOutline, CreateOutline, CheckmarkCircleOutline, ArrowUndoOutline, ImagesOutline, CloseOutline, ArrowForwardOutline } from '@vicons/ionicons5';
import { getPetGalleryByPetId } from '@/api.js';

import HealthEventFormModal from './HealthEventFormModal.vue';
import WeightLogFormModal from '@/components/WeightLogFormModal.vue';
import WeightTrendChart from '@/components/WeightTrendChart.vue';

const petStore = usePetStore();
const authStore = useAuthStore();
const message = useMessage();
const { getAvatarUrl, getGalleryThumbnailUrl, getFullResolutionUrl } = useCloudinaryImage();

// 最近照片状态
const recentPhotos = ref([]);
const loadingPhotos = ref(false);

// 全屏查看照片状态
const showPhotoLightbox = ref(false);
const lightboxPhotoUrl = ref('');

// 监听宠物详情变化，加载最近照片
watch(
  () => petStore.detailModal.data?.id,
  async (petId) => {
    if (!petId) {
      recentPhotos.value = [];
      return;
    }
    loadingPhotos.value = true;
    try {
      const response = await getPetGalleryByPetId(petId);
      // 只取最近 6 张
      recentPhotos.value = (response.data || []).slice(0, 6);
    } catch (err) {
      console.error('加载最近照片失败:', err);
      recentPhotos.value = [];
    } finally {
      loadingPhotos.value = false;
    }
  }
);

const openPhotoLightbox = (imageUrl) => {
  lightboxPhotoUrl.value = getFullResolutionUrl(imageUrl);
  showPhotoLightbox.value = true;
};

const closePhotoLightbox = () => {
  showPhotoLightbox.value = false;
  lightboxPhotoUrl.value = '';
};

const handleViewAllPhotos = () => {
  const pet = petStore.detailModal.data;
  if (pet) {
    petStore.closeAllPetModals();
    petStore.navigateToAlbum(pet.id, pet.name);
  }
};

// 计算宠物年龄
const petAge = computed(() => {
  const birthday = petStore.detailModal.data?.birthday;
  if (!birthday) return null;
  const birth = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return null;
  if (years === 0 && months === 0) return '不到1个月';
  if (years === 0) return `${months}个月`;
  if (months === 0) return `${years}岁`;
  return `${years}岁${months}个月`;
});

const handleShowWeightForm = () => {
  if (petStore.detailModal.data?.id) {
    petStore.showWeightLogFormModal(petStore.detailModal.data.id);
  }
};

const handleShowHealthEventForm = () => {
  if (petStore.detailModal.data?.id) {
    petStore.showHealthEventFormModal(petStore.detailModal.data.id);
  }
};

// 编辑体重记录
const handleEditWeightLog = (log) => {
  if (petStore.detailModal.data?.id) {
    petStore.showWeightLogFormModal(petStore.detailModal.data.id, log);
  }
};

// 编辑健康事件
const handleEditHealthEvent = (event) => {
  if (petStore.detailModal.data?.id) {
    petStore.showHealthEventFormModal(petStore.detailModal.data.id, event);
  }
};

const handleClose = () => {
  petStore.closeAllPetModals();
};

// 删除宠物
const handleDeletePet = async () => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再删除宠物');
    return;
  }

  const petId = petStore.detailModal.data?.id;
  if (!petId) return;

  try {
    await petStore.handleDeletePet(petId);
    message.success('删除成功');
    petStore.closeAllPetModals();
  } catch (error) {
    console.error('删除宠物失败:', error);
    message.error('删除失败，请重试');
  }
};

// 删除体重记录
const handleDeleteWeightLog = async (logId) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再操作');
    return;
  }

  try {
    await petStore.handleDeleteWeightLog(logId);
    message.success('体重记录已删除');
  } catch (error) {
    console.error('删除体重记录失败:', error);
    message.error('删除失败，请重试');
  }
};

// 删除健康事件
const handleDeleteHealthEvent = async (eventId) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再操作');
    return;
  }

  try {
    await petStore.handleDeleteHealthEvent(eventId);
    message.success('健康事件已删除');
  } catch (error) {
    console.error('删除健康事件失败:', error);
    message.error('删除失败，请重试');
  }
};

// 标记健康事件为已完成
const handleCompleteHealthEvent = async (eventId) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再操作');
    return;
  }

  try {
    await petStore.handleCompleteHealthEvent(eventId);
    message.success('事件已标记为完成');
  } catch (error) {
    console.error('标记事件完成失败:', error);
    message.error('操作失败，请重试');
  }
};

// 撤销健康事件的已完成状态
const handleUncompleteHealthEvent = async (eventId) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再操作');
    return;
  }

  try {
    await petStore.handleUncompleteHealthEvent(eventId);
    message.success('事件已恢复为待处理');
  } catch (error) {
    console.error('撤销事件完成失败:', error);
    message.error('操作失败，请重试');
  }
};

// 获取物种标签类型
const getSpeciesTagType = (species) => {
  const typeMap = {
    'dog': 'warning',
    'cat': 'success',
    'bird': 'info',
    'fish': 'info',
    'rabbit': 'warning',
    'hamster': 'warning'
  };
  return typeMap[species?.toLowerCase()] || 'default';
};

// 事件类型图标映射
const eventTypeIconMap = [
  { keywords: ['疫苗', '接种', '免疫'], icon: '💉' },
  { keywords: ['驱虫', '体内驱虫', '体外驱虫', '除虫'], icon: '🐛' },
  { keywords: ['体检', '检查', '年度检查'], icon: '🩺' },
  { keywords: ['洗澡', '美容', '清洁'], icon: '🛁' },
  { keywords: ['绝育', '手术', '节育'], icon: '✂️' },
  { keywords: ['洗牙', '牙齿', '口腔'], icon: '🦷' },
  { keywords: ['眼', '眼睛'], icon: '👁️' },
  { keywords: ['皮肤', '皮毛'], icon: '🐾' },
  { keywords: ['血', '血液', '化验', '检验'], icon: '🧪' },
  { keywords: ['喂', '喂养', '饮食', '粮'], icon: '🍖' },
];

const getEventTypeIcon = (label) => {
  if (!label) return '📋';
  for (const mapping of eventTypeIconMap) {
    if (mapping.keywords.some(kw => label.includes(kw))) {
      return mapping.icon;
    }
  }
  return '📋';
};
</script>

<template>
  <n-modal
    :show="petStore.detailModal.show"
    @update:show="handleClose"
    preset="card"
    style="width: 650px; border-radius: 24px;"
    :bordered="false"
    class="pet-detail-modal"
    :mask-closable="false"
  >
    <template v-if="petStore.detailModal.loading">
      <n-space vertical align="center">
        <n-skeleton height="120px" width="120px" :sharp="false" style="border-radius: 50%;" />
        <n-skeleton text :repeat="6" />
      </n-space>
    </template>

    <template v-else-if="petStore.detailModal.data">
      <!-- 头部头像区域 -->
      <div class="detail-header">
        <div class="avatar-container">
          <n-avatar
            round
            :size="120"
            :src="getAvatarUrl(petStore.detailModal.data.avatarUrl || petStore.detailModal.data.profileImageUrl)"
            style="border: 4px solid #FFE4E9; box-shadow: 0 4px 20px rgba(255, 155, 168, 0.3);"
          />
        </div>
        <h2 class="pet-name">{{ petStore.detailModal.data.name }}</h2>
        <n-space align="center" :size="8">
          <n-tag v-if="petStore.detailModal.data.speciesLabel" :type="getSpeciesTagType(petStore.detailModal.data.species)" round size="small">
            <template #icon>
              <n-icon :component="PawOutline" size="14" />
            </template>
            {{ petStore.detailModal.data.speciesLabel }}
          </n-tag>
          <n-tag v-if="petStore.detailModal.data.breedLabel" type="default" round size="small">
            {{ petStore.detailModal.data.breedLabel }}
          </n-tag>
        </n-space>
      </div>

      <!-- 基本信息 -->
      <n-card class="info-card" :bordered="false" size="small">
        <n-grid :cols="2" :x-gap="16" :y-gap="12">
          <n-gi>
            <n-space align="center" :size="8">
              <n-icon :component="CalendarOutline" color="#FF9BA8" />
              <n-text depth="3">生日:</n-text>
              <n-text>{{ petStore.detailModal.data.birthday || '未知' }}</n-text>
              <n-tag v-if="petAge" type="success" size="small" round>🎂 {{ petAge }}</n-tag>
            </n-space>
          </n-gi>
          <n-gi>
            <n-space align="center" :size="8">
              <n-icon :component="HeartOutline" color="#FF6B8A" />
              <n-text depth="3">获赞:</n-text>
              <n-text strong style="color: #FF6B8A;">{{ petStore.detailModal.data.likeCount || 0 }}</n-text>
            </n-space>
          </n-gi>
        </n-grid>
      </n-card>

      <!-- 最近照片 -->
      <div class="section">
        <n-space align="center" :size="8" class="section-header">
          <n-icon :component="ImagesOutline" size="18" color="#C084FC" />
          <n-h4 prefix-bar style="margin: 0;">最近照片</n-h4>
        </n-space>
        <n-spin :show="loadingPhotos">
          <n-card v-if="recentPhotos.length" class="section-card" :bordered="false" size="small">
            <div class="photo-grid">
              <div
                v-for="photo in recentPhotos"
                :key="photo.id"
                class="photo-grid-item"
                @click="openPhotoLightbox(photo.imageUrl)"
              >
                <img
                  :src="getGalleryThumbnailUrl(photo.imageUrl)"
                  :alt="photo.description || '宠物照片'"
                  loading="lazy"
                />
              </div>
            </div>
            <div class="view-all-photos">
              <n-button text type="primary" @click="handleViewAllPhotos" size="small">
                <template #icon>
                  <n-icon :component="ArrowForwardOutline" />
                </template>
                查看全部照片
              </n-button>
            </div>
          </n-card>
          <n-card v-else-if="!loadingPhotos" class="section-card" :bordered="false" size="small">
            <n-empty description="还没有照片哦～" size="small">
              <template #icon>
                <span style="font-size: 32px;">📷</span>
              </template>
            </n-empty>
          </n-card>
        </n-spin>
      </div>

      <!-- 体重记录 -->
      <div class="section">
        <n-space align="center" :size="8" class="section-header">
          <n-icon :component="ScaleOutline" size="18" color="#7DD3FC" />
          <n-h4 prefix-bar style="margin: 0;">近期体重</n-h4>
        </n-space>
        <WeightTrendChart
          :weight-logs="petStore.detailModal.data.weightLogs"
          style="margin-bottom: 10px;"
        />
        <n-card class="section-card" :bordered="false" size="small">
          <n-list v-if="petStore.detailModal.data.weightLogs?.length" hoverable>
            <n-list-item v-for="log in petStore.detailModal.data.weightLogs" :key="log.id">
              <n-space justify="space-between" align="center">
                <n-text>{{ log.logDate }}</n-text>
                <n-space align="center">
                  <n-text strong>{{ log.weightKg }} kg</n-text>
                  <n-popconfirm
                    @positive-click="handleEditWeightLog(log)"
                    :positive-button-props="{ type: 'info', size: 'tiny' }"
                    :negative-button-props="{ size: 'tiny' }"
                  >
                    <template #trigger>
                      <n-button text type="info" size="tiny" :disabled="!authStore.isAuthenticated">
                        <template #icon>
                          <n-icon :component="CreateOutline" :size="14" />
                        </template>
                      </n-button>
                    </template>
                    编辑这条体重记录？
                  </n-popconfirm>
                  <n-popconfirm
                    @positive-click="handleDeleteWeightLog(log.id)"
                    :positive-button-props="{ type: 'error', size: 'tiny' }"
                    :negative-button-props="{ size: 'tiny' }"
                  >
                    <template #trigger>
                      <n-button text type="error" size="tiny" :disabled="!authStore.isAuthenticated">
                        <template #icon>
                          <n-icon :component="TrashOutline" :size="14" />
                        </template>
                      </n-button>
                    </template>
                    确定删除这条体重记录？
                  </n-popconfirm>
                </n-space>
              </n-space>
            </n-list-item>
          </n-list>
          <n-text v-else depth="3"><i>暂无体重记录</i></n-text>
        </n-card>
      </div>

      <!-- 健康事件 -->
      <div class="section">
        <n-space align="center" :size="8" class="section-header">
          <n-icon :component="HeartOutline" size="18" color="#86EFAC" />
          <n-h4 prefix-bar style="margin: 0;">健康事件</n-h4>
        </n-space>
        <n-card class="section-card" :bordered="false" size="small">
          <n-list v-if="petStore.detailModal.data.healthEvents?.length" hoverable>
            <n-list-item v-for="event in petStore.detailModal.data.healthEvents" :key="event.id" :class="{ 'completed-event': event.status === 1 }">
              <n-space vertical :size="4">
                <n-space align="center" justify="space-between">
                  <n-space align="center">
                    <n-text>{{ event.eventDate }}</n-text>
                    <span class="event-type-icon">{{ getEventTypeIcon(event.eventTypeLabel) }}</span>
                    <n-tag :type="event.nextDueDate ? 'warning' : 'success'" size="small" round>
                      {{ event.eventTypeLabel || '未知事件' }}
                    </n-tag>
                    <n-tag v-if="event.status === 1" type="success" size="small" round>
                      ✓ 已完成
                    </n-tag>
                  </n-space>
                  <n-popconfirm
                    v-if="event.status !== 1"
                    @positive-click="handleCompleteHealthEvent(event.id)"
                    :positive-button-props="{ type: 'success', size: 'tiny' }"
                    :negative-button-props="{ size: 'tiny' }"
                  >
                    <template #trigger>
                      <n-button text type="success" size="tiny" :disabled="!authStore.isAuthenticated">
                        <template #icon>
                          <n-icon :component="CheckmarkCircleOutline" :size="14" />
                        </template>
                      </n-button>
                    </template>
                    标记此事件为已完成？
                  </n-popconfirm>
                  <n-popconfirm
                    v-if="event.status === 1"
                    @positive-click="handleUncompleteHealthEvent(event.id)"
                    :positive-button-props="{ type: 'warning', size: 'tiny' }"
                    :negative-button-props="{ size: 'tiny' }"
                  >
                    <template #trigger>
                      <n-button text type="warning" size="tiny" :disabled="!authStore.isAuthenticated">
                        <template #icon>
                          <n-icon :component="ArrowUndoOutline" :size="14" />
                        </template>
                      </n-button>
                    </template>
                    撤销完成，恢复为待处理？
                  </n-popconfirm>
                  <n-popconfirm
                    @positive-click="handleEditHealthEvent(event)"
                    :positive-button-props="{ type: 'info', size: 'tiny' }"
                    :negative-button-props="{ size: 'tiny' }"
                  >
                    <template #trigger>
                      <n-button text type="info" size="tiny" :disabled="!authStore.isAuthenticated">
                        <template #icon>
                          <n-icon :component="CreateOutline" :size="14" />
                        </template>
                      </n-button>
                    </template>
                    编辑这条健康事件？
                  </n-popconfirm>
                  <n-popconfirm
                    @positive-click="handleDeleteHealthEvent(event.id)"
                    :positive-button-props="{ type: 'error', size: 'tiny' }"
                    :negative-button-props="{ size: 'tiny' }"
                  >
                    <template #trigger>
                      <n-button text type="error" size="tiny" :disabled="!authStore.isAuthenticated">
                        <template #icon>
                          <n-icon :component="TrashOutline" :size="14" />
                        </template>
                      </n-button>
                    </template>
                    确定删除这条健康事件？
                  </n-popconfirm>
                </n-space>
                <n-text v-if="event.notes" depth="3">{{ event.notes }}</n-text>
                <n-text v-if="event.nextDueDate" depth="2" style="color: #F59E0B;">
                  下次: {{ event.nextDueDate }}
                </n-text>
              </n-space>
            </n-list-item>
          </n-list>
          <n-text v-else depth="3"><i>暂无健康事件</i></n-text>
        </n-card>
      </div>
    </template>

    <template #footer>
      <n-space justify="space-between">
        <n-popconfirm
          @positive-click="handleDeletePet"
          :positive-button-props="{ type: 'error', size: 'small' }"
          :negative-button-props="{ size: 'small' }"
        >
          <template #trigger>
            <n-button type="error" secondary size="small">
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
              删除
            </n-button>
          </template>
          确定要删除这只宠物吗？此操作不可恢复。
        </n-popconfirm>
        <n-space justify="end">
          <n-button @click="handleShowWeightForm" class="action-btn">
            <template #icon>
              <n-icon><ScaleOutline /></n-icon>
            </template>
            体重记录
          </n-button>
          <n-button @click="handleShowHealthEventForm" class="action-btn">
            <template #icon>
              <n-icon><HeartOutline /></n-icon>
            </template>
            添加事件
          </n-button>
          <n-button type="primary" @click="petStore.switchToEditMode()" class="edit-btn">
            编辑信息
          </n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
  <HealthEventFormModal />
  <WeightLogFormModal />

  <!-- 照片全屏查看弹窗 -->
  <n-modal
    v-model:show="showPhotoLightbox"
    preset="card"
    style="width: 95vw; max-width: 1200px; height: 90vh; background: rgba(20, 20, 20, 0.95);"
    content-style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 0; position: relative;"
    :bordered="false"
    :closable="false"
    @after-leave="closePhotoLightbox"
  >
    <n-button
      circle
      size="large"
      class="photo-lightbox-close"
      @click="closePhotoLightbox"
    >
      <template #icon>
        <n-icon size="24"><CloseOutline /></n-icon>
      </template>
    </n-button>
    <img :src="lightboxPhotoUrl" class="photo-lightbox-img" alt="照片全屏查看" />
  </n-modal>
</template>

<style scoped>
.pet-detail-modal :deep(.n-card-header) {
  padding-bottom: 0;
}

/* 头部 */
.detail-header {
  text-align: center;
  padding: 20px 0;
}

.avatar-container {
  margin-bottom: 16px;
}

.pet-name {
  font-size: 24px;
  font-weight: 700;
  color: #2D2D2D;
  margin-bottom: 12px;
}

/* 信息卡片 */
.info-card {
  background: var(--pet-bg-secondary);
  border-radius: 16px;
  margin: 16px 0;
}

/* 区块 */
.section {
  margin-top: 16px;
}

.section-header {
  margin-bottom: 8px;
}

.section-header :deep(.n-h4) {
  font-weight: 600;
  color: var(--pet-text);
}

.section-card {
  background: var(--pet-bg-secondary);
  border-radius: 16px;
}

/* 删除按钮 */
.delete-btn {
  border-radius: 12px;
}

/* 按钮 */
.action-btn {
  border-radius: 12px;
}

.edit-btn {
  background: linear-gradient(135deg, var(--pet-primary) 0%, var(--pet-primarySuppl) 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 600;
}

/* 已完成事件样式 */
.pet-detail-modal :deep(.n-list-item.completed-event) {
  opacity: 0.65;
}

.pet-detail-modal :deep(.n-list-item.completed-event .n-text) {
  text-decoration: line-through;
}

/* 查看全部照片 */
.view-all-photos {
  text-align: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--pet-border, #F0E6E0);
}

/* 照片网格 */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.photo-grid-item {
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.photo-grid-item:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 16px rgba(192, 132, 252, 0.3);
}

.photo-grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-grid-item:hover img {
  transform: scale(1.08);
}

/* 照片 lightbox */
.photo-lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.2) !important;
  border: none;
  color: white !important;
}

.photo-lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 事件类型图标 */
.event-type-icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

/* 响应式：照片网格 */
@media (max-width: 576px) {
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
