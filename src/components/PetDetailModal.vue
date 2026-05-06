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
  NText,
  NSkeleton,
  NButton,
  NIcon,
  NTag,
  NPopconfirm,
  NSpin,
  NCollapse,
  NCollapseItem
} from 'naive-ui';
import { ScaleOutline, HeartOutline, CalendarOutline, PawOutline, TrashOutline, CreateOutline, CheckmarkCircleOutline, ArrowUndoOutline, ImagesOutline, CloseOutline, ArrowForwardOutline, RestaurantOutline, TimeOutline, BrushOutline } from '@vicons/ionicons5';
import { getPetGalleryByPetId } from '@/api.js';

import HealthEventFormModal from './HealthEventFormModal.vue';
import WeightLogFormModal from '@/components/WeightLogFormModal.vue';
import WeightTrendChart from '@/components/WeightTrendChart.vue';
import FeedingRecordFormModal from '@/components/FeedingRecordFormModal.vue';
import BathingRecordFormModal from '@/components/BathingRecordFormModal.vue';

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
    healthEventFilter.value = 'all';
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

const handleViewTimeline = () => {
  const pet = petStore.detailModal.data;
  if (pet) {
    petStore.closeAllPetModals();
    petStore.navigateToTimeline(pet.id);
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

// 喂养记录
const handleShowFeedingForm = () => {
  if (petStore.detailModal.data?.id) {
    petStore.showFeedingRecordFormModal(petStore.detailModal.data.id);
  }
};

const handleEditFeedingRecord = (record) => {
  if (petStore.detailModal.data?.id) {
    petStore.showFeedingRecordFormModal(petStore.detailModal.data.id, record);
  }
};

const handleDeleteFeedingRecord = async (recordId) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再操作');
    return;
  }
  try {
    await petStore.handleDeleteFeedingRecord(recordId);
    message.success('喂养记录已删除');
  } catch (error) {
    console.error('删除喂养记录失败:', error);
    message.error('删除失败，请重试');
  }
};

// 洗澡美容记录
const handleShowBathingForm = () => {
  if (petStore.detailModal.data?.id) {
    petStore.showBathingRecordFormModal(petStore.detailModal.data.id);
  }
};

const handleEditBathingRecord = (record) => {
  if (petStore.detailModal.data?.id) {
    petStore.showBathingRecordFormModal(petStore.detailModal.data.id, record);
  }
};

const handleDeleteBathingRecord = async (recordId) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再操作');
    return;
  }
  try {
    await petStore.handleDeleteBathingRecord(recordId);
    message.success('洗澡美容记录已删除');
  } catch (error) {
    console.error('删除洗澡美容记录失败:', error);
    message.error('删除失败，请重试');
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

import { getEventTypeIcon } from '@/utils/eventTypeIcon.js';

// 健康事件筛选状态
const healthEventFilter = ref('all');

const pendingCount = computed(() => {
  return (petStore.detailModal.data?.healthEvents || []).filter(e => e.status !== 1).length;
});

const completedCount = computed(() => {
  return (petStore.detailModal.data?.healthEvents || []).filter(e => e.status === 1).length;
});

const filteredHealthEvents = computed(() => {
  const events = petStore.detailModal.data?.healthEvents || [];
  if (healthEventFilter.value === 'pending') return events.filter(e => e.status !== 1);
  if (healthEventFilter.value === 'completed') return events.filter(e => e.status === 1);
  return events;
});

// 宠物统计数据
const petStats = computed(() => {
  const data = petStore.detailModal.data;
  if (!data) return [];
  return [
    { icon: '📷', label: '照片', value: recentPhotos.value.length, color: '#C084FC' },
    { icon: '⚖️', label: '体重', value: data.weightLogs?.length || 0, color: '#7DD3FC' },
    { icon: '🩺', label: '健康', value: data.healthEvents?.length || 0, color: '#86EFAC' },
    { icon: '🍽️', label: '喂养', value: data.feedingRecords?.length || 0, color: '#FBBF24' },
    { icon: '🛁', label: '美容', value: data.bathingRecords?.length || 0, color: '#06B6D4' },
    { icon: '📖', label: '时间线', value: timelineItems.value.length, color: '#FF9BA8' }
  ];
});

// 折叠面板展开状态
const expandedSections = ref(['timeline', 'photos', 'weight', 'health', 'feeding', 'bathing']);

// 成长时间线：合并体重记录、健康事件和照片
const timelineItems = computed(() => {
  const data = petStore.detailModal.data;
  if (!data) return [];

  const items = [];

  // 体重记录
  if (data.weightLogs) {
    for (const log of data.weightLogs) {
      items.push({
        id: `w-${log.id}`,
        type: 'weight',
        date: log.logDate,
        icon: '⚖️',
        title: `${log.weightKg} kg`,
        subtitle: '体重记录',
        color: '#7DD3FC'
      });
    }
  }

  // 健康事件
  if (data.healthEvents) {
    for (const event of data.healthEvents) {
      const icon = getEventTypeIcon(event.eventTypeLabel) || '🩺';
      const isCompleted = event.status === 1;
      items.push({
        id: `h-${event.id}`,
        type: 'health',
        date: event.eventDate,
        icon,
        title: event.eventTypeLabel || '健康事件',
        subtitle: event.notes || (isCompleted ? '已完成' : ''),
        color: isCompleted ? '#86EFAC' : '#FCA5A5',
        completed: isCompleted
      });
    }
  }

  // 喂养记录
  if (data.feedingRecords) {
    for (const record of data.feedingRecords) {
      const dateStr = record.feedTime
        ? new Date(record.feedTime).toISOString().slice(0, 10)
        : null;
      const amountStr = record.amountGrams ? `${record.amountGrams}g` : '';
      const title = [record.foodType, amountStr].filter(Boolean).join(' · ') || '喂食';
      items.push({
        id: `f-${record.id}`,
        type: 'feeding',
        date: dateStr,
        icon: '🍽️',
        title,
        subtitle: record.notes || '',
        color: '#FBBF24'
      });
    }
  }

  // 洗澡美容记录
  if (data.bathingRecords) {
    for (const record of data.bathingRecords) {
      const dateStr = record.bathTime
        ? new Date(record.bathTime).toISOString().slice(0, 10)
        : null;
      const serviceIcons = { '洗澡': '🛁', '美容': '✂️', '梳毛': '🪮', '剪指甲': '💅', '清洁耳朵': '👂', '刷牙': '🪥', '修剪毛发': '💇', '药浴': '💊' };
      items.push({
        id: `b-${record.id}`,
        type: 'bathing',
        date: dateStr,
        icon: serviceIcons[record.serviceType] || '🛁',
        title: record.serviceType || '洗澡美容',
        subtitle: record.notes || '',
        color: '#06B6D4'
      });
    }
  }

  // 照片上传记录
  if (recentPhotos.value && recentPhotos.value.length) {
    for (const photo of recentPhotos.value) {
      const dateStr = photo.createdAt
        ? new Date(photo.createdAt).toISOString().slice(0, 10)
        : null;
      items.push({
        id: `p-${photo.id}`,
        type: 'photo',
        date: dateStr,
        icon: '📷',
        title: photo.description || '上传照片',
        subtitle: photo.description ? '照片上传' : '',
        color: '#C084FC'
      });
    }
  }

  // 按日期降序排列
  items.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  // 标记是否显示月份分组头部
  let lastMonth = '';
  for (const item of items) {
    if (item.date) {
      const d = new Date(item.date);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      item.showMonth = month !== lastMonth;
      item.monthLabel = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      lastMonth = month;
    } else {
      item.showMonth = false;
      item.monthLabel = '';
    }
  }

  return items;
});
</script>

<template>
  <!-- 自定义遮罩层 -->
  <Transition name="detail-overlay">
    <div
      v-if="petStore.detailModal.show"
      class="detail-overlay"
      @click.self="handleClose"
    >
      <!-- 浮动装饰元素 -->
      <span class="detail-float-shape" style="top: 8%; left: 5%; font-size: 24px; animation-delay: 0s;">🐾</span>
      <span class="detail-float-shape" style="top: 15%; right: 8%; font-size: 20px; animation-delay: 1.2s;">✨</span>
      <span class="detail-float-shape" style="bottom: 20%; left: 8%; font-size: 22px; animation-delay: 0.6s;">💕</span>
      <span class="detail-float-shape" style="top: 45%; right: 5%; font-size: 18px; animation-delay: 1.8s;">🌸</span>
      <span class="detail-float-shape" style="bottom: 10%; right: 12%; font-size: 20px; animation-delay: 0.3s;">⭐</span>
      <span class="detail-float-shape" style="bottom: 35%; left: 4%; font-size: 18px; animation-delay: 2.1s;">🦋</span>

      <!-- 毛玻璃卡片 -->
      <div class="detail-glass-card" @click.stop>
        <!-- 自定义关闭按钮 -->
        <button class="detail-close-btn" @click="handleClose" aria-label="关闭">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- 卡片内容滚动区 -->
        <div class="detail-scroll-area">
          <template v-if="petStore.detailModal.loading">
            <div class="detail-skeleton-wrap">
              <n-skeleton height="120px" width="120px" :sharp="false" style="border-radius: 50%;" />
              <n-skeleton text :repeat="6" style="margin-top: 16px;" />
            </div>
          </template>

          <template v-else-if="petStore.detailModal.data">
            <!-- 头部头像区域 -->
            <div class="detail-header">
              <div class="detail-avatar-ring">
                <div class="detail-avatar-glow" />
                <n-avatar
                  round
                  :size="110"
                  :src="getAvatarUrl(petStore.detailModal.data.avatarUrl || petStore.detailModal.data.profileImageUrl)"
                  class="detail-avatar-img"
                />
              </div>
              <h2 class="detail-pet-name">{{ petStore.detailModal.data.name }}</h2>
              <div class="detail-tags">
                <span v-if="petStore.detailModal.data.speciesLabel" class="detail-tag detail-tag-species">
                  <n-icon :component="PawOutline" size="13" />
                  {{ petStore.detailModal.data.speciesLabel }}
                </span>
                <span v-if="petStore.detailModal.data.breedLabel" class="detail-tag detail-tag-breed">
                  {{ petStore.detailModal.data.breedLabel }}
                </span>
                <span v-if="petStore.detailModal.data.gender === 'male'" class="detail-tag detail-tag-male">♂ 公</span>
                <span v-if="petStore.detailModal.data.gender === 'female'" class="detail-tag detail-tag-female">♀ 母</span>
              </div>
            </div>

            <!-- 基本信息 -->
            <div class="detail-info-card">
              <div class="detail-info-row">
                <div class="detail-info-item">
                  <n-icon :component="CalendarOutline" color="#FF9BA8" :size="18" />
                  <div class="detail-info-text">
                    <span class="detail-info-label">生日</span>
                    <span class="detail-info-value">{{ petStore.detailModal.data.birthday || '未知' }}</span>
                  </div>
                  <span v-if="petAge" class="detail-age-badge">🎂 {{ petAge }}</span>
                </div>
                <div class="detail-info-item">
                  <n-icon :component="HeartOutline" color="#FF6B8A" :size="18" />
                  <div class="detail-info-text">
                    <span class="detail-info-label">获赞</span>
                    <span class="detail-info-value detail-like-count">{{ petStore.detailModal.data.likeCount || 0 }}</span>
                  </div>
                </div>
              </div>
              <!-- 备注信息 -->
              <div v-if="petStore.detailModal.data.notes" class="detail-notes">
                <span class="detail-notes-icon">📝</span>
                <span class="detail-notes-text">{{ petStore.detailModal.data.notes }}</span>
              </div>
            </div>

            <!-- 统计概览条 -->
            <div class="detail-stats-bar">
              <div
                v-for="stat in petStats"
                :key="stat.label"
                class="detail-stat-item"
              >
                <span class="detail-stat-icon">{{ stat.icon }}</span>
                <span class="detail-stat-value" :style="{ color: stat.color }">{{ stat.value }}</span>
                <span class="detail-stat-label">{{ stat.label }}</span>
              </div>
            </div>

            <!-- 可折叠内容区块 -->
            <n-collapse
              v-model:expanded-names="expandedSections"
              class="detail-collapse"
            >
              <!-- 成长时间线 -->
              <n-collapse-item v-if="timelineItems.length" name="timeline">
                <template #header>
                  <n-space align="center" :size="8">
                    <span style="font-size: 18px;">📖</span>
                    <span class="collapse-header-title">成长时间线</span>
                    <n-tag size="tiny" round>{{ timelineItems.length }} 条记录</n-tag>
                  </n-space>
                </template>
                <div class="section-card timeline-card">
                  <div class="timeline">
                    <template v-for="item in timelineItems" :key="item.id">
                      <div v-if="item.showMonth" class="timeline-month">
                        <span class="timeline-month-label">{{ item.monthLabel }}</span>
                      </div>
                      <div class="timeline-item" :class="{ 'timeline-photo-item': item.type === 'photo', 'timeline-feeding-item': item.type === 'feeding' }">
                        <div class="timeline-dot" :style="{ background: item.color }">
                          <span class="timeline-dot-icon">{{ item.icon }}</span>
                        </div>
                        <div class="timeline-line" />
                        <div class="timeline-content" :class="{ 'timeline-completed': item.completed }">
                          <div class="timeline-content-header">
                            <span class="timeline-title">{{ item.title }}</span>
                            <span class="timeline-date">{{ item.date }}</span>
                          </div>
                          <span v-if="item.subtitle" class="timeline-subtitle">{{ item.subtitle }}</span>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </n-collapse-item>

              <!-- 最近照片 -->
              <n-collapse-item name="photos">
                <template #header>
                  <n-space align="center" :size="8">
                    <n-icon :component="ImagesOutline" size="18" color="#C084FC" />
                    <span class="collapse-header-title">最近照片</span>
                    <n-tag v-if="recentPhotos.length" size="tiny" round>{{ recentPhotos.length }} 张</n-tag>
                  </n-space>
                </template>
                <n-spin :show="loadingPhotos">
                  <div v-if="recentPhotos.length" class="section-card">
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
                  </div>
                  <div v-else-if="!loadingPhotos" class="section-card detail-empty-section">
                    <div class="detail-empty">
                      <span class="detail-empty-icon">📷</span>
                      <span class="detail-empty-text">还没有照片哦～</span>
                    </div>
                  </div>
                </n-spin>
              </n-collapse-item>

              <!-- 体重记录 -->
              <n-collapse-item name="weight">
                <template #header>
                  <n-space align="center" :size="8">
                    <n-icon :component="ScaleOutline" size="18" color="#7DD3FC" />
                    <span class="collapse-header-title">近期体重</span>
                    <n-tag v-if="petStore.detailModal.data.weightLogs?.length" size="tiny" round>
                      {{ petStore.detailModal.data.weightLogs.length }} 条
                    </n-tag>
                  </n-space>
                </template>
                <WeightTrendChart
                  :weight-logs="petStore.detailModal.data.weightLogs"
                  style="margin-bottom: 10px;"
                />
                <div class="section-card">
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
                  <div v-else class="detail-empty">
                    <span class="detail-empty-icon">⚖️</span>
                    <span class="detail-empty-text">暂无体重记录</span>
                  </div>
                </div>
              </n-collapse-item>

              <!-- 健康事件 -->
              <n-collapse-item name="health">
                <template #header>
                  <n-space align="center" :size="8">
                    <n-icon :component="HeartOutline" size="18" color="#86EFAC" />
                    <span class="collapse-header-title">健康事件</span>
                    <n-tag v-if="petStore.detailModal.data.healthEvents?.length" size="tiny" round>
                      {{ petStore.detailModal.data.healthEvents.length }} 条
                    </n-tag>
                  </n-space>
                </template>
                <!-- 状态筛选标签 -->
                <div v-if="petStore.detailModal.data.healthEvents?.length" class="health-event-filter">
                  <n-button
                    :type="healthEventFilter === 'all' ? 'primary' : 'default'"
                    size="tiny"
                    round
                    :secondary="healthEventFilter !== 'all'"
                    @click.stop="healthEventFilter = 'all'"
                  >
                    全部 ({{ petStore.detailModal.data.healthEvents.length }})
                  </n-button>
                  <n-button
                    :type="healthEventFilter === 'pending' ? 'warning' : 'default'"
                    size="tiny"
                    round
                    :secondary="healthEventFilter !== 'pending'"
                    @click.stop="healthEventFilter = 'pending'"
                  >
                    待处理 ({{ pendingCount }})
                  </n-button>
                  <n-button
                    :type="healthEventFilter === 'completed' ? 'success' : 'default'"
                    size="tiny"
                    round
                    :secondary="healthEventFilter !== 'completed'"
                    @click.stop="healthEventFilter = 'completed'"
                  >
                    已完成 ({{ completedCount }})
                  </n-button>
                </div>
                <div class="section-card">
                  <n-list v-if="filteredHealthEvents.length" hoverable>
                    <n-list-item v-for="event in filteredHealthEvents" :key="event.id" :class="{ 'completed-event': event.status === 1 }">
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
                  <div v-else class="detail-empty">
                    <span class="detail-empty-icon">{{ healthEventFilter === 'all' ? '🩺' : '📋' }}</span>
                    <span class="detail-empty-text">{{ healthEventFilter === 'all' ? '暂无健康事件' : '该分类下暂无事件' }}</span>
                  </div>
                </div>
              </n-collapse-item>

              <!-- 喂养记录 -->
              <n-collapse-item name="feeding">
                <template #header>
                  <n-space align="center" :size="8">
                    <n-icon :component="RestaurantOutline" size="18" color="#FBBF24" />
                    <span class="collapse-header-title">喂养记录</span>
                    <n-tag v-if="petStore.detailModal.data.feedingRecords?.length" size="tiny" round>
                      {{ petStore.detailModal.data.feedingRecords.length }} 条
                    </n-tag>
                  </n-space>
                </template>
                <div class="section-card">
                  <n-list v-if="petStore.detailModal.data.feedingRecords?.length" hoverable>
                    <n-list-item v-for="record in petStore.detailModal.data.feedingRecords" :key="record.id">
                      <n-space vertical :size="4">
                        <n-space align="center" justify="space-between">
                          <n-space align="center">
                            <n-text>{{ record.feedTime ? new Date(record.feedTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '' }}</n-text>
                            <n-tag type="warning" size="small" round>🍽️ {{ record.foodType || '喂食' }}</n-tag>
                            <n-tag v-if="record.amountGrams" size="small" round>{{ record.amountGrams }}g</n-tag>
                          </n-space>
                          <n-space :size="4">
                            <n-popconfirm
                              @positive-click="handleEditFeedingRecord(record)"
                              :positive-button-props="{ type: 'info', size: 'tiny' }"
                              :negative-button-props="{ size: 'tiny' }"
                            >
                              <template #trigger>
                                <n-button text type="info" size="tiny" :disabled="!authStore.isAuthenticated">
                                  <template #icon><n-icon :component="CreateOutline" :size="14" /></template>
                                </n-button>
                              </template>
                              编辑这条喂养记录？
                            </n-popconfirm>
                            <n-popconfirm
                              @positive-click="handleDeleteFeedingRecord(record.id)"
                              :positive-button-props="{ type: 'error', size: 'tiny' }"
                              :negative-button-props="{ size: 'tiny' }"
                            >
                              <template #trigger>
                                <n-button text type="error" size="tiny" :disabled="!authStore.isAuthenticated">
                                  <template #icon><n-icon :component="TrashOutline" :size="14" /></template>
                                </n-button>
                              </template>
                              确定删除这条喂养记录？
                            </n-popconfirm>
                          </n-space>
                        </n-space>
                        <n-text v-if="record.notes" depth="3">{{ record.notes }}</n-text>
                      </n-space>
                    </n-list-item>
                  </n-list>
                  <div v-else class="detail-empty">
                    <span class="detail-empty-icon">🍽️</span>
                    <span class="detail-empty-text">还没有喂养记录哦～</span>
                  </div>
                </div>
              </n-collapse-item>

              <!-- 洗澡美容记录 -->
              <n-collapse-item name="bathing">
                <template #header>
                  <n-space align="center" :size="8">
                    <n-icon :component="BrushOutline" size="18" color="#06B6D4" />
                    <span class="collapse-header-title">洗澡美容</span>
                    <n-tag v-if="petStore.detailModal.data.bathingRecords?.length" size="tiny" round>
                      {{ petStore.detailModal.data.bathingRecords.length }} 条
                    </n-tag>
                  </n-space>
                </template>
                <div class="section-card">
                  <div style="margin-bottom: 12px;">
                    <n-button size="small" type="primary" @click="handleShowBathingForm" :disabled="!authStore.isAuthenticated" style="background: linear-gradient(135deg, #0891B2, #06B6D4); border: none; border-radius: 10px;">
                      <template #icon><n-icon :component="BrushOutline" /></template>
                      记录洗澡美容
                    </n-button>
                  </div>
                  <n-list v-if="petStore.detailModal.data.bathingRecords?.length" hoverable>
                    <n-list-item v-for="record in petStore.detailModal.data.bathingRecords" :key="record.id">
                      <n-space vertical :size="4">
                        <n-space align="center" justify="space-between">
                          <n-space align="center">
                            <n-text>{{ record.bathTime ? new Date(record.bathTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '' }}</n-text>
                            <n-tag type="info" size="small" round>🛁 {{ record.serviceType || '洗澡' }}</n-tag>
                          </n-space>
                          <n-space :size="4">
                            <n-popconfirm
                              @positive-click="handleEditBathingRecord(record)"
                              :positive-button-props="{ type: 'info', size: 'tiny' }"
                              :negative-button-props="{ size: 'tiny' }"
                            >
                              <template #trigger>
                                <n-button text type="info" size="tiny" :disabled="!authStore.isAuthenticated">
                                  <template #icon><n-icon :component="CreateOutline" :size="14" /></template>
                                </n-button>
                              </template>
                              编辑这条记录？
                            </n-popconfirm>
                            <n-popconfirm
                              @positive-click="handleDeleteBathingRecord(record.id)"
                              :positive-button-props="{ type: 'error', size: 'tiny' }"
                              :negative-button-props="{ size: 'tiny' }"
                            >
                              <template #trigger>
                                <n-button text type="error" size="tiny" :disabled="!authStore.isAuthenticated">
                                  <template #icon><n-icon :component="TrashOutline" :size="14" /></template>
                                </n-button>
                              </template>
                              确定删除这条记录？
                            </n-popconfirm>
                          </n-space>
                        </n-space>
                        <n-text v-if="record.notes" depth="3">{{ record.notes }}</n-text>
                      </n-space>
                    </n-list-item>
                  </n-list>
                  <div v-else class="detail-empty">
                    <span class="detail-empty-icon">🛁</span>
                    <span class="detail-empty-text">还没有洗澡美容记录哦～</span>
                  </div>
                </div>
              </n-collapse-item>
            </n-collapse>
          </template>
        </div>

        <!-- 底部操作栏 -->
        <div v-if="!petStore.detailModal.loading && petStore.detailModal.data" class="detail-footer">
          <div class="detail-footer-left">
            <n-popconfirm
              @positive-click="handleDeletePet"
              :positive-button-props="{ type: 'error', size: 'small' }"
              :negative-button-props="{ size: 'small' }"
            >
              <template #trigger>
                <n-button type="error" secondary size="small" class="detail-footer-btn detail-delete-btn">
                  <template #icon>
                    <n-icon><TrashOutline /></n-icon>
                  </template>
                  删除
                </n-button>
              </template>
              确定要删除这只宠物吗？此操作不可恢复。
            </n-popconfirm>
          </div>
          <div class="detail-footer-right">
            <n-button @click="handleShowWeightForm" class="detail-footer-btn" size="small">
              <template #icon><n-icon><ScaleOutline /></n-icon></template>
              <span class="btn-label-text">体重</span>
            </n-button>
            <n-button @click="handleShowHealthEventForm" class="detail-footer-btn" size="small">
              <template #icon><n-icon><HeartOutline /></n-icon></template>
              <span class="btn-label-text">事件</span>
            </n-button>
            <n-button @click="handleShowFeedingForm" class="detail-footer-btn" size="small">
              <template #icon><n-icon><RestaurantOutline /></n-icon></template>
              <span class="btn-label-text">喂食</span>
            </n-button>
            <n-button @click="handleShowBathingForm" class="detail-footer-btn" size="small">
              <template #icon><n-icon><BrushOutline /></n-icon></template>
              <span class="btn-label-text">美容</span>
            </n-button>
            <n-button @click="handleViewTimeline" class="detail-footer-btn" size="small">
              <template #icon><n-icon><TimeOutline /></n-icon></template>
              <span class="btn-label-text">时间线</span>
            </n-button>
            <n-button type="primary" @click="petStore.switchToEditMode()" class="detail-edit-btn" size="small">
              编辑信息
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <HealthEventFormModal />
  <WeightLogFormModal />
  <FeedingRecordFormModal />
  <BathingRecordFormModal />

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
/* ===== 遮罩层 ===== */
.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 20px;
}

:global(.dark-mode) .detail-overlay {
  background: rgba(0, 0, 0, 0.6);
}

/* 遮罩过渡 */
.detail-overlay-enter-active {
  transition: opacity 0.3s ease;
}
.detail-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.detail-overlay-enter-from,
.detail-overlay-leave-to {
  opacity: 0;
}

/* ===== 浮动装饰 ===== */
.detail-float-shape {
  position: absolute;
  pointer-events: none;
  opacity: 0.5;
  animation: detailFloat 6s ease-in-out infinite;
  z-index: 0;
  user-select: none;
}

:global(.dark-mode) .detail-float-shape {
  opacity: 0.3;
}

@keyframes detailFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-12px) rotate(5deg); }
  66% { transform: translateY(6px) rotate(-3deg); }
}

/* ===== 毛玻璃卡片 ===== */
.detail-glass-card {
  position: relative;
  z-index: 1;
  width: 650px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-radius: 24px;
  border: 1px solid rgba(255, 200, 210, 0.4);
  box-shadow:
    0 8px 32px rgba(255, 155, 168, 0.15),
    0 2px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  overflow: hidden;
  animation: detailCardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

:global(.dark-mode) .detail-glass-card {
  background: rgba(35, 35, 60, 0.92);
  border-color: rgba(255, 155, 168, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

@keyframes detailCardIn {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(16px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ===== 关闭按钮 ===== */
.detail-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 155, 168, 0.1);
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.detail-close-btn:hover {
  background: rgba(255, 155, 168, 0.2);
  color: #FF6B8A;
  transform: rotate(90deg);
}

:global(.dark-mode) .detail-close-btn {
  color: #888;
  background: rgba(255, 255, 255, 0.08);
}

:global(.dark-mode) .detail-close-btn:hover {
  background: rgba(255, 155, 168, 0.2);
  color: #FF9BA8;
}

/* ===== 滚动区 ===== */
.detail-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 28px 28px 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 155, 168, 0.3) transparent;
}

.detail-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.detail-scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.detail-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(255, 155, 168, 0.3);
  border-radius: 3px;
}

/* ===== 骨架屏 ===== */
.detail-skeleton-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
}

/* ===== 头部 ===== */
.detail-header {
  text-align: center;
  padding: 8px 0 20px;
}

.detail-avatar-ring {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.detail-avatar-glow {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF9BA8, #FFC3A0, #C084FC, #FF9BA8);
  background-size: 300% 300%;
  animation: avatarGlow 4s ease infinite;
  opacity: 0.5;
  filter: blur(8px);
}

:global(.dark-mode) .detail-avatar-glow {
  opacity: 0.35;
}

@keyframes avatarGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.detail-avatar-img {
  position: relative;
  z-index: 1;
  border: 4px solid #fff;
  box-shadow: 0 4px 20px rgba(255, 155, 168, 0.3);
}

:global(.dark-mode) .detail-avatar-img {
  border-color: #2D2D50;
  box-shadow: 0 4px 20px rgba(255, 155, 168, 0.2);
}

.detail-pet-name {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #FF6B8A, #FF9BA8, #C084FC);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px;
  line-height: 1.3;
}

/* 标签 */
.detail-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.detail-tag-species {
  background: rgba(255, 155, 168, 0.12);
  color: #E8637A;
}

:global(.dark-mode) .detail-tag-species {
  background: rgba(255, 155, 168, 0.15);
  color: #FFB4C2;
}

.detail-tag-breed {
  background: rgba(192, 132, 252, 0.1);
  color: #9333EA;
}

:global(.dark-mode) .detail-tag-breed {
  background: rgba(192, 132, 252, 0.15);
  color: #D8B4FE;
}

.detail-tag-male {
  background: rgba(96, 165, 250, 0.1);
  color: #3B82F6;
}

:global(.dark-mode) .detail-tag-male {
  background: rgba(96, 165, 250, 0.15);
  color: #93C5FD;
}

.detail-tag-female {
  background: rgba(244, 114, 182, 0.1);
  color: #EC4899;
}

:global(.dark-mode) .detail-tag-female {
  background: rgba(244, 114, 182, 0.15);
  color: #F9A8D4;
}

/* ===== 信息卡片 ===== */
.detail-info-card {
  background: rgba(255, 240, 243, 0.5);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  border: 1px solid rgba(255, 200, 210, 0.3);
  padding: 16px;
  margin-bottom: 16px;
}

:global(.dark-mode) .detail-info-card {
  background: rgba(45, 45, 72, 0.5);
  border-color: rgba(255, 155, 168, 0.12);
}

.detail-info-row {
  display: flex;
  gap: 16px;
}

.detail-info-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.2s;
}

:global(.dark-mode) .detail-info-item {
  background: rgba(255, 255, 255, 0.04);
}

.detail-info-text {
  display: flex;
  flex-direction: column;
}

.detail-info-label {
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 500;
}

.detail-info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--pet-text, #2D2D2D);
}

:global(.dark-mode) .detail-info-value {
  color: #E8E8E8;
}

.detail-like-count {
  color: #FF6B8A !important;
}

.detail-age-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  background: rgba(134, 239, 172, 0.15);
  color: #16A34A;
  font-weight: 600;
  white-space: nowrap;
  margin-left: auto;
}

:global(.dark-mode) .detail-age-badge {
  background: rgba(134, 239, 172, 0.12);
  color: #86EFAC;
}

/* 备注 */
.detail-notes {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 155, 168, 0.25);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.6;
  word-break: break-word;
}

.detail-notes-icon {
  flex-shrink: 0;
  font-size: 15px;
}

.detail-notes-text {
  font-size: 13px;
  color: #6B7280;
}

:global(.dark-mode) .detail-notes-text {
  color: #9CA3AF;
}

/* ===== 统计概览条 ===== */
.detail-stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 6px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, rgba(255, 240, 243, 0.6), rgba(240, 235, 255, 0.4));
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 200, 210, 0.3);
  animation: statsBarIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}

:global(.dark-mode) .detail-stats-bar {
  background: linear-gradient(135deg, rgba(50, 40, 70, 0.6), rgba(35, 35, 60, 0.5));
  border-color: rgba(255, 155, 168, 0.12);
}

@keyframes statsBarIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 8px;
  border-radius: 12px;
  transition: all 0.25s ease;
  cursor: default;
  min-width: 52px;
}

.detail-stat-item:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

:global(.dark-mode) .detail-stat-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.detail-stat-icon {
  font-size: 18px;
  line-height: 1;
  animation: statIconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.detail-stat-item:nth-child(1) .detail-stat-icon { animation-delay: 0.25s; }
.detail-stat-item:nth-child(2) .detail-stat-icon { animation-delay: 0.3s; }
.detail-stat-item:nth-child(3) .detail-stat-icon { animation-delay: 0.35s; }
.detail-stat-item:nth-child(4) .detail-stat-icon { animation-delay: 0.4s; }
.detail-stat-item:nth-child(5) .detail-stat-icon { animation-delay: 0.45s; }

@keyframes statIconPop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.detail-stat-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
}

.detail-stat-label {
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 500;
  white-space: nowrap;
}

:global(.dark-mode) .detail-stat-label {
  color: #8888A0;
}

/* ===== 折叠面板 ===== */
.detail-collapse {
  margin-top: 4px;
}

.detail-collapse :deep(.n-collapse-item) {
  margin-bottom: 8px;
  border-radius: 16px;
  background: rgba(255, 240, 243, 0.35);
  padding: 4px 12px;
  border: 1px solid rgba(255, 200, 210, 0.2);
  transition: border-color 0.25s, box-shadow 0.25s;
}

.detail-collapse :deep(.n-collapse-item:hover) {
  border-color: rgba(255, 155, 168, 0.3);
}

:global(.dark-mode) .detail-collapse :deep(.n-collapse-item) {
  background: rgba(42, 42, 69, 0.5);
  border-color: rgba(255, 155, 168, 0.1);
}

.detail-collapse :deep(.n-collapse-item__header) {
  padding: 12px 4px;
  font-size: 15px;
}

.detail-collapse :deep(.n-collapse-item__content-wrapper) {
  padding-bottom: 8px;
}

.detail-collapse :deep(.n-collapse-item__arrow) {
  margin-right: 4px;
}

.collapse-header-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--pet-text, #2D2D2D);
}

:global(.dark-mode) .collapse-header-title {
  color: #E8E8E8;
}

/* ===== 区块卡片 ===== */
.section-card {
  background: transparent;
  border-radius: 12px;
}

/* ===== 自定义空状态 ===== */
.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  gap: 8px;
}

.detail-empty-icon {
  font-size: 32px;
  animation: emptyBounce 2s ease-in-out infinite;
}

@keyframes emptyBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.detail-empty-text {
  font-size: 13px;
  color: #9CA3AF;
}

:global(.dark-mode) .detail-empty-text {
  color: #6B7280;
}

/* ===== 已完成事件 ===== */
.detail-glass-card :deep(.n-list-item.completed-event) {
  opacity: 0.6;
}

.detail-glass-card :deep(.n-list-item.completed-event .n-text) {
  text-decoration: line-through;
}

/* ===== 查看全部照片 ===== */
.view-all-photos {
  text-align: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 155, 168, 0.2);
}

/* ===== 照片网格 ===== */
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

/* ===== 照片 lightbox ===== */
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

/* ===== 健康事件筛选 ===== */
.health-event-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

/* ===== 事件类型图标 ===== */
.event-type-icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

/* ===== 底部操作栏 ===== */
.detail-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 28px;
  border-top: 1px solid rgba(255, 200, 210, 0.25);
  background: rgba(255, 245, 247, 0.6);
  backdrop-filter: blur(10px);
}

:global(.dark-mode) .detail-footer {
  background: rgba(30, 30, 50, 0.6);
  border-top-color: rgba(255, 155, 168, 0.1);
}

.detail-footer-left {
  flex-shrink: 0;
}

.detail-footer-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.detail-footer-btn {
  border-radius: 10px !important;
  font-weight: 500;
}

.detail-delete-btn {
  border-radius: 10px !important;
}

.detail-edit-btn {
  background: linear-gradient(135deg, #FF9BA8 0%, #FF6B8A 100%) !important;
  border: none !important;
  border-radius: 10px !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 107, 138, 0.3);
  transition: box-shadow 0.25s, transform 0.25s;
}

.detail-edit-btn:hover {
  box-shadow: 0 4px 16px rgba(255, 107, 138, 0.45) !important;
  transform: translateY(-1px);
}

:global(.dark-mode) .detail-edit-btn {
  background: linear-gradient(135deg, #FF7A8F 0%, #FF5577 100%) !important;
}

.btn-label-text {
  font-size: 12px;
}

/* ===== 成长时间线 ===== */
.timeline-card {
  max-height: 400px;
  overflow-y: auto;
}

.timeline {
  position: relative;
  padding-left: 28px;
}

.timeline-month {
  position: relative;
  margin: 16px 0 10px -28px;
  padding-left: 28px;
}

.timeline-month:first-child {
  margin-top: 0;
}

.timeline-month-label {
  font-size: 13px;
  font-weight: 700;
  color: #FF9BA8;
  background: rgba(255, 155, 168, 0.1);
  padding: 2px 10px;
  border-radius: 10px;
}

:global(.dark-mode) .timeline-month-label {
  color: #FFB4C2;
  background: rgba(255, 155, 168, 0.15);
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding-bottom: 14px;
  min-height: 48px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -28px;
  top: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.timeline-dot-icon {
  font-size: 11px;
  line-height: 1;
}

.timeline-line {
  position: absolute;
  left: -18px;
  top: 24px;
  width: 2px;
  bottom: 0;
  background: rgba(255, 155, 168, 0.2);
}

.timeline-item:last-child .timeline-line {
  display: none;
}

:global(.dark-mode) .timeline-line {
  background: #3D3D5C;
}

.timeline-content {
  flex: 1;
  min-width: 0;
  padding: 4px 0;
}

.timeline-content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--pet-text, #2D2D2D);
}

:global(.dark-mode) .timeline-title {
  color: #E8E8E8;
}

.timeline-date {
  font-size: 12px;
  color: #9CA3AF;
  flex-shrink: 0;
}

:global(.dark-mode) .timeline-date {
  color: #8888A0;
}

.timeline-subtitle {
  font-size: 12px;
  color: #6B6B6B;
  margin-top: 2px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark-mode) .timeline-subtitle {
  color: #B8B8CC;
}

.timeline-completed .timeline-title {
  opacity: 0.6;
}

.timeline-completed .timeline-subtitle {
  color: #86EFAC;
}

.timeline-photo-item .timeline-title {
  color: #9333EA;
}

:global(.dark-mode) .timeline-photo-item .timeline-title {
  color: #D8B4FE;
}

.timeline-feeding-item .timeline-title {
  color: #D97706;
}

:global(.dark-mode) .timeline-feeding-item .timeline-title {
  color: #FBBF24;
}

/* ===== 移动端响应式 ===== */
@media (max-width: 768px) {
  .detail-glass-card {
    width: 95vw;
    max-height: 92vh;
  }

  .detail-scroll-area {
    padding: 20px 18px 16px;
  }

  .detail-footer {
    padding: 12px 18px;
    flex-direction: column;
    gap: 10px;
  }

  .detail-footer-left {
    width: 100%;
  }

  .detail-footer-right {
    width: 100%;
    justify-content: center;
  }

  .detail-pet-name {
    font-size: 20px;
  }

  .detail-info-row {
    flex-direction: column;
    gap: 8px;
  }

  .detail-stats-bar {
    padding: 10px 10px;
    gap: 4px;
  }

  .detail-stat-item {
    padding: 4px 4px;
    min-width: 44px;
  }

  .detail-stat-icon {
    font-size: 16px;
  }

  .detail-stat-value {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .detail-overlay {
    padding: 10px;
  }

  .detail-glass-card {
    border-radius: 20px;
  }

  .detail-scroll-area {
    padding: 16px 14px 12px;
  }

  .detail-footer {
    padding: 10px 14px;
  }

  .detail-footer-right {
    gap: 4px;
  }

  .btn-label-text {
    display: none;
  }

  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-avatar-img {
    width: 80px !important;
    height: 80px !important;
  }

  .detail-pet-name {
    font-size: 18px;
  }

  .detail-stats-bar {
    padding: 8px 6px;
    gap: 2px;
    border-radius: 14px;
  }

  .detail-stat-item {
    padding: 4px 2px;
    min-width: 38px;
  }

  .detail-stat-icon {
    font-size: 14px;
  }

  .detail-stat-value {
    font-size: 14px;
  }

  .detail-stat-label {
    font-size: 10px;
  }
}
</style>
