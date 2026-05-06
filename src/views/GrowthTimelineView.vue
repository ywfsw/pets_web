<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import {
  NSelect,
  NCard,
  NTag,
  NSpace,
  NEmpty,
  NSpin,
  NButton,
  NIcon,
  NModal,
  NAvatar
} from 'naive-ui';
import {
  PawOutline,
  CloseOutline,
  TimeOutline
} from '@vicons/ionicons5';
import { getEventTypeIcon } from '@/utils/eventTypeIcon.js';
import { fetchPetDetail, getPetGalleryByPetId } from '@/api.js';

const petStore = usePetStore();
const dictStore = useDictionaryStore();
const { getFullResolutionUrl } = useCloudinaryImage();

// State
const selectedPetId = ref(null);
const petDetail = ref(null);
const photos = ref([]);
const loading = ref(false);
const filterType = ref('all');

// Photo lightbox
const showPhotoLightbox = ref(false);
const lightboxPhotoUrl = ref('');

// Pet selector options
const petOptions = computed(() => {
  return petStore.petList.map(pet => ({
    label: pet.name,
    value: pet.id
  }));
});

// Load pet detail + photos
const loadTimelineData = async (petId) => {
  if (!petId) {
    petDetail.value = null;
    photos.value = [];
    return;
  }
  loading.value = true;
  try {
    const [detailRes, photoRes] = await Promise.all([
      fetchPetDetail(petId),
      getPetGalleryByPetId(petId)
    ]);
    petDetail.value = detailRes.data;
    photos.value = photoRes.data || [];
  } catch (err) {
    console.error('加载时间线数据失败:', err);
    petDetail.value = null;
    photos.value = [];
  } finally {
    loading.value = false;
  }
};

// Watch pet selection
watch(selectedPetId, (newId) => {
  if (newId) {
    loadTimelineData(newId);
  } else {
    petDetail.value = null;
    photos.value = [];
  }
});

// Pre-select from store (e.g. navigated from detail modal)
onMounted(async () => {
  if (petStore.petList.length === 0) {
    await petStore.loadPetList();
  }
  if (petStore.timelinePetId) {
    selectedPetId.value = petStore.timelinePetId;
    petStore.timelinePetId = null;
  } else if (petStore.petList.length === 1) {
    selectedPetId.value = petStore.petList[0].id;
  }
});

// Build all timeline items
const allTimelineItems = computed(() => {
  const data = petDetail.value;
  if (!data) return [];

  const items = [];

  // Weight logs
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

  // Health events
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
        completed: isCompleted,
        nextDueDate: event.nextDueDate
      });
    }
  }

  // Feeding records
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

  // Photos
  if (photos.value && photos.value.length) {
    for (const photo of photos.value) {
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
        color: '#C084FC',
        imageUrl: photo.imageUrl
      });
    }
  }

  // Sort by date descending
  items.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  return items;
});

// Filtered items
const filteredItems = computed(() => {
  if (filterType.value === 'all') return allTimelineItems.value;
  return allTimelineItems.value.filter(item => item.type === filterType.value);
});

// Add month grouping to filtered items
const groupedItems = computed(() => {
  const items = filteredItems.value;
  let lastMonth = '';
  return items.map(item => {
    const updated = { ...item };
    if (item.date) {
      const d = new Date(item.date);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      updated.showMonth = month !== lastMonth;
      updated.monthLabel = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      lastMonth = month;
    } else {
      updated.showMonth = false;
      updated.monthLabel = '';
    }
    return updated;
  });
});

// Stats
const stats = computed(() => {
  const items = allTimelineItems.value;
  return {
    total: items.length,
    weight: items.filter(i => i.type === 'weight').length,
    health: items.filter(i => i.type === 'health').length,
    feeding: items.filter(i => i.type === 'feeding').length,
    photo: items.filter(i => i.type === 'photo').length
  };
});

// Filter options for segmented control
const filterOptions = computed(() => [
  { label: `全部 (${stats.value.total})`, value: 'all' },
  { label: `⚖️ 体重 (${stats.value.weight})`, value: 'weight' },
  { label: `🩺 健康 (${stats.value.health})`, value: 'health' },
  { label: `🍽️ 喂养 (${stats.value.feeding})`, value: 'feeding' },
  { label: `📷 照片 (${stats.value.photo})`, value: 'photo' }
]);

// Pet age
const petAge = computed(() => {
  const birthday = petDetail.value?.birthday;
  if (!birthday) return null;
  const birth = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years < 0) return null;
  if (years === 0 && months === 0) return '不到1个月';
  if (years === 0) return `${months}个月`;
  if (months === 0) return `${years}岁`;
  return `${years}岁${months}个月`;
});

// Species info
const speciesLabel = computed(() => {
  if (!petDetail.value) return '';
  const species = dictStore.species.find(s => s.id === petDetail.value.speciesId);
  return species ? species.itemLabel : '';
});

const breedLabel = computed(() => {
  if (!petDetail.value) return '';
  const breed = dictStore.breeds.find(b => b.id === petDetail.value.breedId);
  return breed ? breed.itemLabel : '';
});

// Photo lightbox handlers
const openPhotoLightbox = (imageUrl) => {
  lightboxPhotoUrl.value = getFullResolutionUrl(imageUrl);
  showPhotoLightbox.value = true;
};

const closePhotoLightbox = () => {
  showPhotoLightbox.value = false;
  lightboxPhotoUrl.value = '';
};
</script>

<template>
  <div class="growth-timeline-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">
          <span class="page-title-icon">📖</span>
          成长时间线
        </h1>
        <p class="page-subtitle">记录宠物成长的每一个珍贵瞬间</p>
      </div>
      <div class="page-header-right">
        <n-select
          v-model:value="selectedPetId"
          :options="petOptions"
          placeholder="选择一只宠物"
          clearable
          filterable
          style="width: 200px;"
          class="pet-selector"
        >
          <template #prefix>
            <n-icon :component="PawOutline" size="16" />
          </template>
        </n-select>
      </div>
    </div>

    <!-- No pet selected -->
    <n-card v-if="!selectedPetId" class="empty-card" :bordered="false">
      <n-empty description="请先选择一只宠物查看成长时间线" size="large">
        <template #icon>
          <span style="font-size: 48px;">🐾</span>
        </template>
      </n-empty>
    </n-card>

    <!-- Loading -->
    <n-spin v-else-if="loading" :show="true" style="width: 100%;">
      <div style="height: 300px;" />
    </n-spin>

    <!-- Timeline Content -->
    <template v-else-if="petDetail">
      <!-- Pet Info Card -->
      <n-card class="pet-info-card" :bordered="false">
        <div class="pet-info-content">
          <n-avatar
            round
            :size="56"
            :style="{ background: 'linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%)' }"
          >
            {{ petDetail.name?.charAt(0) || '🐾' }}
          </n-avatar>
          <div class="pet-info-text">
            <div class="pet-info-name">
              {{ petDetail.name }}
              <n-tag v-if="petDetail.gender === 'male'" type="info" size="small" round>♂</n-tag>
              <n-tag v-if="petDetail.gender === 'female'" type="error" size="small" round>♀</n-tag>
            </div>
            <div class="pet-info-meta">
              <span v-if="speciesLabel">{{ speciesLabel }}</span>
              <span v-if="breedLabel">· {{ breedLabel }}</span>
              <span v-if="petAge">· 🎂 {{ petAge }}</span>
              <span v-if="petDetail.birthday">· {{ petDetail.birthday }}</span>
            </div>
          </div>
          <div class="pet-info-stats">
            <div class="stat-item">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">总记录</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.weight }}</span>
              <span class="stat-label">体重</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.health }}</span>
              <span class="stat-label">健康</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.feeding }}</span>
              <span class="stat-label">喂养</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.photo }}</span>
              <span class="stat-label">照片</span>
            </div>
          </div>
        </div>
      </n-card>

      <!-- Filter -->
      <div class="filter-bar">
        <n-space :size="6" wrap>
          <n-button
            v-for="opt in filterOptions"
            :key="opt.value"
            :type="filterType === opt.value ? 'primary' : 'default'"
            size="small"
            round
            :secondary="filterType !== opt.value"
            @click="filterType = opt.value"
          >
            {{ opt.label }}
          </n-button>
        </n-space>
      </div>

      <!-- Timeline -->
      <div v-if="groupedItems.length" class="timeline-container">
        <template v-for="item in groupedItems" :key="item.id">
          <div v-if="item.showMonth" class="timeline-month-header">
            <n-icon :component="TimeOutline" size="14" />
            <span>{{ item.monthLabel }}</span>
          </div>
          <div
            class="timeline-row"
            :class="{
              'timeline-row-photo': item.type === 'photo',
              'timeline-row-feeding': item.type === 'feeding',
              'timeline-row-completed': item.completed
            }"
          >
            <div class="timeline-dot-col">
              <div class="timeline-dot" :style="{ background: item.color }">
                <span class="timeline-dot-icon">{{ item.icon }}</span>
              </div>
              <div class="timeline-connector" />
            </div>
            <div class="timeline-body" @click="item.type === 'photo' && item.imageUrl ? openPhotoLightbox(item.imageUrl) : null">
              <div class="timeline-row-top">
                <span class="timeline-item-title" :class="{ 'completed-title': item.completed }">{{ item.title }}</span>
                <span class="timeline-item-date">{{ item.date || '未知日期' }}</span>
              </div>
              <span v-if="item.subtitle" class="timeline-item-subtitle">{{ item.subtitle }}</span>
              <span v-if="item.nextDueDate" class="timeline-item-due">下次: {{ item.nextDueDate }}</span>
              <div v-if="item.type === 'photo' && item.imageUrl" class="timeline-photo-preview">
                <img :src="item.imageUrl" :alt="item.title" loading="lazy" />
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Empty state -->
      <n-card v-else class="empty-card" :bordered="false">
        <n-empty description="暂无该类型的记录" size="large">
          <template #icon>
            <span style="font-size: 48px;">📝</span>
          </template>
        </n-empty>
      </n-card>
    </template>

    <!-- Photo Lightbox -->
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
        class="lightbox-close"
        @click="closePhotoLightbox"
      >
        <template #icon>
          <n-icon size="24"><CloseOutline /></n-icon>
        </template>
      </n-button>
      <img :src="lightboxPhotoUrl" class="lightbox-img" alt="照片全屏查看" />
    </n-modal>
  </div>
</template>

<style scoped>
.growth-timeline-page {
  max-width: 800px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2D2D2D;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

:global(.dark-mode) .page-title {
  color: #FFFFFF;
}

.page-title-icon {
  font-size: 32px;
}

.page-subtitle {
  font-size: 14px;
  color: #9CA3AF;
  margin: 4px 0 0 42px;
}

:global(.dark-mode) .page-subtitle {
  color: #8888A0;
}

/* Pet Info Card */
.pet-info-card {
  margin-bottom: 20px;
  border-radius: 20px !important;
  background: linear-gradient(135deg, rgba(255, 155, 168, 0.08) 0%, rgba(125, 211, 252, 0.08) 100%);
}

:global(.dark-mode) .pet-info-card {
  background: linear-gradient(135deg, rgba(255, 155, 168, 0.12) 0%, rgba(125, 211, 252, 0.08) 100%);
}

.pet-info-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.pet-info-text {
  flex: 1;
  min-width: 200px;
}

.pet-info-name {
  font-size: 20px;
  font-weight: 700;
  color: #2D2D2D;
  display: flex;
  align-items: center;
  gap: 8px;
}

:global(.dark-mode) .pet-info-name {
  color: #FFFFFF;
}

.pet-info-meta {
  font-size: 13px;
  color: #6B6B6B;
  margin-top: 4px;
}

:global(.dark-mode) .pet-info-meta {
  color: #B8B8CC;
}

.pet-info-stats {
  display: flex;
  gap: 20px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #FF9BA8;
}

.stat-label {
  font-size: 11px;
  color: #9CA3AF;
}

:global(.dark-mode) .stat-label {
  color: #8888A0;
}

/* Filter Bar */
.filter-bar {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

/* Timeline Container */
.timeline-container {
  position: relative;
  padding-left: 36px;
}

/* Month Header */
.timeline-month-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 28px 0 16px -36px;
  padding-left: 36px;
  font-size: 14px;
  font-weight: 700;
  color: #FF9BA8;
  background: rgba(255, 155, 168, 0.08);
  padding-top: 4px;
  padding-bottom: 4px;
  border-radius: 10px;
}

.timeline-month-header:first-child {
  margin-top: 0;
}

:global(.dark-mode) .timeline-month-header {
  color: #FFB4C2;
  background: rgba(255, 155, 168, 0.12);
}

/* Timeline Row */
.timeline-row {
  display: flex;
  gap: 16px;
  position: relative;
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.timeline-row:last-child {
  margin-bottom: 0;
}

/* Dot Column */
.timeline-dot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  left: -36px;
  top: 0;
  width: 22px;
}

.timeline-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-dot-icon {
  font-size: 11px;
  line-height: 1;
}

.timeline-connector {
  width: 2px;
  flex: 1;
  background: var(--pet-border, #F0E6E0);
  margin-top: 4px;
  min-height: 16px;
}

:global(.dark-mode) .timeline-connector {
  background: #3D3D5C;
}

.timeline-row:last-child .timeline-connector {
  display: none;
}

/* Timeline Body */
.timeline-body {
  flex: 1;
  min-width: 0;
  background: var(--pet-card, #FFFFFF);
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  cursor: default;
}

.timeline-body:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.timeline-row-photo .timeline-body {
  cursor: pointer;
}

:global(.dark-mode) .timeline-body {
  background: #2A2A45;
}

:global(.dark-mode) .timeline-body:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.timeline-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.timeline-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #2D2D2D;
}

:global(.dark-mode) .timeline-item-title {
  color: #E8E8E8;
}

.completed-title {
  opacity: 0.6;
  text-decoration: line-through;
}

.timeline-item-date {
  font-size: 12px;
  color: #9CA3AF;
  flex-shrink: 0;
}

:global(.dark-mode) .timeline-item-date {
  color: #8888A0;
}

.timeline-item-subtitle {
  font-size: 12px;
  color: #6B6B6B;
  margin-top: 4px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark-mode) .timeline-item-subtitle {
  color: #B8B8CC;
}

.timeline-item-due {
  font-size: 12px;
  color: #F59E0B;
  margin-top: 2px;
  display: block;
}

.timeline-row-photo .timeline-item-title {
  color: #9333EA;
}

:global(.dark-mode) .timeline-row-photo .timeline-item-title {
  color: #D8B4FE;
}

.timeline-row-feeding .timeline-item-title {
  color: #D97706;
}

:global(.dark-mode) .timeline-row-feeding .timeline-item-title {
  color: #FBBF24;
}

/* Photo preview in timeline */
.timeline-photo-preview {
  margin-top: 10px;
  border-radius: 10px;
  overflow: hidden;
  max-width: 200px;
  max-height: 150px;
}

.timeline-photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Empty card */
.empty-card {
  border-radius: 20px !important;
  padding: 60px 20px;
  text-align: center;
}

/* Lightbox */
.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.2) !important;
  border: none;
  color: white !important;
}

.lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-left {
    text-align: center;
  }

  .page-subtitle {
    margin-left: 0;
  }

  .pet-info-content {
    flex-direction: column;
    text-align: center;
  }

  .pet-info-text {
    text-align: center;
  }

  .pet-info-name {
    justify-content: center;
  }

  .pet-info-meta {
    text-align: center;
  }

  .pet-info-stats {
    justify-content: center;
    width: 100%;
  }

  .filter-bar {
    overflow-x: auto;
    justify-content: flex-start;
    padding-bottom: 4px;
  }

  .timeline-container {
    padding-left: 28px;
  }

  .timeline-month-header {
    margin-left: -28px;
    padding-left: 28px;
  }

  .timeline-dot-col {
    left: -28px;
  }

  .timeline-dot {
    width: 18px;
    height: 18px;
  }

  .timeline-dot-icon {
    font-size: 9px;
  }

  .timeline-body {
    padding: 10px 12px;
  }

  .timeline-photo-preview {
    max-width: 160px;
  }
}
</style>
