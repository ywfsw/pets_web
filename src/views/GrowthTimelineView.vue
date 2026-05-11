<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import PetAvatarSelector from '@/components/PetAvatarSelector.vue';
import {
  NTag,
  NButton,
  NIcon,
  NModal,
  NAvatar
} from 'naive-ui';
import {
  CloseOutline,
  TimeOutline
} from '@vicons/ionicons5';
import { getEventTypeIcon } from '@/utils/eventTypeIcon.js';
import { fetchPetDetail, getPetGalleryByPetId } from '@/api.js';

const petStore = usePetStore();
const dictStore = useDictionaryStore();
const { getFullResolutionUrl } = useCloudinaryImage();

// State
const selectedPetId = ref(petStore.getPageSelectedPet('growth-timeline'));
const petDetail = ref(null);
const photos = ref([]);
const loading = ref(false);
const filterType = ref('all');
const mounted = ref(false);

onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true; });
});

// Photo lightbox
const showPhotoLightbox = ref(false);
const lightboxPhotoUrl = ref('');

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
  petStore.setPageSelectedPet('growth-timeline', newId);
  if (newId) {
    loadTimelineData(newId);
  } else {
    petDetail.value = null;
    photos.value = [];
  }
});

// Pre-select from store (e.g. navigated from detail modal)
const initPetSelection = async () => {
  if (petStore.petList.length === 0) {
    await petStore.loadPetList();
  }
  if (petStore.timelinePetId) {
    selectedPetId.value = petStore.timelinePetId;
    petStore.timelinePetId = null;
  } else if (!selectedPetId.value && petStore.petList.length === 1) {
    selectedPetId.value = petStore.petList[0].id;
  }
};
initPetSelection();

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
  <div class="growth-timeline-page" :class="{ 'is-mounted': mounted }">
    <!-- Hero Area -->
    <div class="timeline-hero">
      <div class="hero-gradient-frame">
        <div class="hero-inner">
          <!-- Floating decorations -->
          <span class="float-shape shape-1">📖</span>
          <span class="float-shape shape-2">🐾</span>
          <span class="float-shape shape-3">🌸</span>
          <span class="float-shape shape-4">✨</span>
          <span class="float-shape shape-5">🦋</span>

          <div class="hero-content">
            <h1 class="hero-title">成长时间线</h1>
            <p class="hero-subtitle">记录宠物成长的每一个珍贵瞬间</p>
          </div>

          <!-- Glass stats bar -->
          <div v-if="selectedPetId && petDetail" class="hero-stats-bar">
            <div class="hero-stat">
              <span class="hero-stat-icon">📊</span>
              <span class="hero-stat-value">{{ stats.total }}</span>
              <span class="hero-stat-label">总记录</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">⚖️</span>
              <span class="hero-stat-value">{{ stats.weight }}</span>
              <span class="hero-stat-label">体重</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">🩺</span>
              <span class="hero-stat-value">{{ stats.health }}</span>
              <span class="hero-stat-label">健康</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">🍽️</span>
              <span class="hero-stat-value">{{ stats.feeding }}</span>
              <span class="hero-stat-label">喂养</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">📷</span>
              <span class="hero-stat-value">{{ stats.photo }}</span>
              <span class="hero-stat-label">照片</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pet Avatar Selector -->
    <div class="pet-selector-section section-entrance" style="--entrance-delay: 0.1s;">
      <PetAvatarSelector
        :pets="petStore.petList"
        :selected-id="selectedPetId"
        :show-all="false"
        @select="selectedPetId = $event"
      />
    </div>

    <!-- No pet selected -->
    <div v-if="!selectedPetId" class="empty-choose section-entrance" style="--entrance-delay: 0.2s;">
      <div class="empty-choose-icon">🐾</div>
      <div class="empty-choose-title">选择一只宠物</div>
      <div class="empty-choose-desc">从上方选择一只宠物，查看它的完整成长记录</div>
    </div>

    <!-- Loading skeleton -->
    <div v-else-if="loading" class="timeline-skeleton">
      <div class="skeleton-pet-card">
        <div class="skeleton-circle" />
        <div class="skeleton-lines">
          <div class="skeleton-line skeleton-line-title" />
          <div class="skeleton-line skeleton-line-sub" />
        </div>
      </div>
      <div class="skeleton-timeline">
        <div v-for="i in 5" :key="i" class="skeleton-timeline-row" :style="{ '--i': i }">
          <div class="skeleton-dot" />
          <div class="skeleton-card" />
        </div>
      </div>
    </div>

    <!-- Timeline Content -->
    <template v-else-if="petDetail">
      <!-- Pet Info Card (glass) -->
      <div class="pet-glass-card section-entrance" style="--entrance-delay: 0.15s;">
        <div class="pet-glass-inner">
          <n-avatar
            round
            :size="60"
            :style="{ background: petDetail.gender === 'female'
              ? 'linear-gradient(135deg, #F9A8D4 0%, #F472B6 100%)'
              : 'linear-gradient(135deg, #93C5FD 0%, #60A5FA 100%)' }"
          >
            {{ petDetail.name?.charAt(0) || '🐾' }}
          </n-avatar>
          <div class="pet-glass-text">
            <div class="pet-glass-name">
              {{ petDetail.name }}
              <n-tag v-if="petDetail.gender === 'male'" type="info" size="small" round>♂</n-tag>
              <n-tag v-if="petDetail.gender === 'female'" type="error" size="small" round>♀</n-tag>
            </div>
            <div class="pet-glass-meta">
              <span v-if="speciesLabel">{{ speciesLabel }}</span>
              <span v-if="breedLabel" class="meta-sep">·</span>
              <span v-if="breedLabel">{{ breedLabel }}</span>
              <span v-if="petAge" class="meta-sep">·</span>
              <span v-if="petAge">🎂 {{ petAge }}</span>
              <span v-if="petDetail.birthday" class="meta-sep">·</span>
              <span v-if="petDetail.birthday">{{ petDetail.birthday }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter -->
      <div class="filter-bar section-entrance" style="--entrance-delay: 0.25s;">
        <div class="filter-pill-group">
          <button
            v-for="opt in filterOptions"
            :key="opt.value"
            class="filter-pill"
            :class="{ active: filterType === opt.value }"
            @click="filterType = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Timeline -->
      <div v-if="groupedItems.length" class="timeline-container section-entrance" style="--entrance-delay: 0.35s;">
        <template v-for="(item, idx) in groupedItems" :key="item.id">
          <!-- Month header -->
          <div v-if="item.showMonth" class="timeline-month-header">
            <div class="month-badge">
              <n-icon :component="TimeOutline" size="14" />
              <span>{{ item.monthLabel }}</span>
            </div>
          </div>
          <!-- Timeline item -->
          <div
            class="timeline-row timeline-item-entrance"
            :style="{ '--item-delay': `${Math.min(idx * 0.04, 0.6)}s` }"
            :class="{
              'timeline-row-photo': item.type === 'photo',
              'timeline-row-feeding': item.type === 'feeding',
              'timeline-row-completed': item.completed
            }"
          >
            <div class="timeline-dot-col">
              <div class="timeline-dot" :style="{ '--dot-color': item.color }">
                <span class="timeline-dot-icon">{{ item.icon }}</span>
                <div class="dot-pulse" />
              </div>
              <div class="timeline-connector" />
            </div>
            <div class="timeline-body" @click="item.type === 'photo' && item.imageUrl ? openPhotoLightbox(item.imageUrl) : null">
              <div class="timeline-card-inner">
                <div class="timeline-row-top">
                  <span class="timeline-item-title" :class="{ 'completed-title': item.completed }">{{ item.title }}</span>
                  <span class="timeline-item-date">{{ item.date || '未知日期' }}</span>
                </div>
                <span v-if="item.subtitle" class="timeline-item-subtitle">{{ item.subtitle }}</span>
                <span v-if="item.nextDueDate" class="timeline-item-due">⏰ 下次: {{ item.nextDueDate }}</span>
                <div v-if="item.type === 'photo' && item.imageUrl" class="timeline-photo-preview">
                  <img :src="item.imageUrl" :alt="item.title" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Empty state (filtered) -->
      <div v-else class="empty-choose section-entrance" style="--entrance-delay: 0.2s;">
        <div class="empty-choose-icon">📝</div>
        <div class="empty-choose-title">暂无该类型的记录</div>
        <div class="empty-choose-desc">尝试切换其他分类查看</div>
      </div>
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
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.growth-timeline-page.is-mounted {
  opacity: 1;
  transform: translateY(0);
}

/* ========== Hero Area ========== */
.timeline-hero {
  margin-bottom: 24px;
  border-radius: 20px;
  padding: 3px;
  background: linear-gradient(135deg, #F9A8D4 0%, #FF9BA8 30%, #C084FC 60%, #A78BFA 100%);
  animation: hero-entrance 0.6s ease both;
}

.hero-gradient-frame {
  border-radius: 18px;
  overflow: hidden;
  position: relative;
}

.hero-inner {
  padding: 28px 28px 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
}

:root[data-theme="dark"] .hero-inner {
  background: rgba(30, 27, 50, 0.85);
}

/* Floating decorations */
.float-shape {
  position: absolute;
  font-size: 20px;
  opacity: 0.25;
  pointer-events: none;
  animation: float-shape-float 6s ease-in-out infinite;
}

.shape-1 { top: 8%; left: 6%; animation-delay: 0s; font-size: 22px; }
.shape-2 { top: 12%; right: 8%; animation-delay: 1.2s; font-size: 18px; }
.shape-3 { bottom: 15%; left: 12%; animation-delay: 2.4s; font-size: 16px; }
.shape-4 { bottom: 8%; right: 15%; animation-delay: 0.8s; font-size: 14px; }
.shape-5 { top: 40%; right: 4%; animation-delay: 3.2s; font-size: 17px; }

.hero-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #FF9BA8 0%, #C084FC 50%, #A78BFA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hero-subtitle {
  font-size: 13px;
  color: #8B7E9B;
  margin: 6px 0 0;
  font-weight: 500;
}

:root[data-theme="dark"] .hero-subtitle {
  color: #A9A0C0;
}

/* Hero Stats Bar */
.hero-stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-top: 18px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid rgba(255, 155, 168, 0.15);
}

:root[data-theme="dark"] .hero-stats-bar {
  background: rgba(40, 36, 60, 0.55);
  border-color: rgba(192, 132, 252, 0.15);
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.hero-stat-icon {
  font-size: 16px;
}

.hero-stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #FF9BA8;
}

:root[data-theme="dark"] .hero-stat-value {
  color: #FFB4C2;
}

.hero-stat-label {
  font-size: 11px;
  color: #9B8EB8;
  font-weight: 500;
}

:root[data-theme="dark"] .hero-stat-label {
  color: #8B7E9B;
}

.hero-stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(192, 132, 252, 0.2);
  flex-shrink: 0;
}

/* ========== Section Entrance ========== */
.section-entrance {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.45s ease, transform 0.45s ease;
  transition-delay: var(--entrance-delay, 0s);
}

.is-mounted .section-entrance {
  opacity: 1;
  transform: translateY(0);
}

/* ========== Pet Avatar Selector ========== */
.pet-selector-section {
  margin-bottom: 20px;
}

/* ========== Empty Choose State ========== */
.empty-choose {
  text-align: center;
  padding: 60px 20px;
  border: 2px dashed rgba(255, 155, 168, 0.25);
  border-radius: 20px;
  margin-top: 8px;
}

.empty-choose-icon {
  font-size: 52px;
  margin-bottom: 16px;
  animation: gentle-bounce 3s ease-in-out infinite;
}

.empty-choose-title {
  font-size: 18px;
  font-weight: 700;
  color: #2D2D2D;
  margin-bottom: 8px;
}

:root[data-theme="dark"] .empty-choose-title {
  color: #E8E8E8;
}

.empty-choose-desc {
  font-size: 14px;
  color: #9CA3AF;
}

:root[data-theme="dark"] .empty-choose-desc {
  color: #8888A0;
}

/* ========== Skeleton Loading ========== */
.timeline-skeleton {
  padding: 20px 0;
}

.skeleton-pet-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 155, 168, 0.06);
  border-radius: 20px;
  margin-bottom: 24px;
}

:root[data-theme="dark"] .skeleton-pet-card {
  background: rgba(192, 132, 252, 0.08);
}

.skeleton-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(90deg, rgba(255, 155, 168, 0.12) 25%, rgba(255, 155, 168, 0.06) 50%, rgba(255, 155, 168, 0.12) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

:root[data-theme="dark"] .skeleton-circle {
  background: linear-gradient(90deg, rgba(192, 132, 252, 0.15) 25%, rgba(192, 132, 252, 0.06) 50%, rgba(192, 132, 252, 0.15) 75%);
  background-size: 200% 100%;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(90deg, rgba(255, 155, 168, 0.12) 25%, rgba(255, 155, 168, 0.06) 50%, rgba(255, 155, 168, 0.12) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

:root[data-theme="dark"] .skeleton-line {
  background: linear-gradient(90deg, rgba(192, 132, 252, 0.15) 25%, rgba(192, 132, 252, 0.06) 50%, rgba(192, 132, 252, 0.15) 75%);
  background-size: 200% 100%;
}

.skeleton-line-title {
  width: 50%;
}

.skeleton-line-sub {
  width: 35%;
}

.skeleton-timeline {
  padding-left: 36px;
  position: relative;
}

.skeleton-timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 155, 168, 0.12);
  border-radius: 1px;
}

:root[data-theme="dark"] .skeleton-timeline::before {
  background: rgba(192, 132, 252, 0.12);
}

.skeleton-timeline-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  opacity: 0;
  animation: skeleton-fade-in 0.4s ease forwards;
  animation-delay: calc(var(--i) * 0.1s);
}

.skeleton-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  left: -11px;
  background: linear-gradient(90deg, rgba(255, 155, 168, 0.12) 25%, rgba(255, 155, 168, 0.06) 50%, rgba(255, 155, 168, 0.12) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

:root[data-theme="dark"] .skeleton-dot {
  background: linear-gradient(90deg, rgba(192, 132, 252, 0.15) 25%, rgba(192, 132, 252, 0.06) 50%, rgba(192, 132, 252, 0.15) 75%);
  background-size: 200% 100%;
}

.skeleton-card {
  flex: 1;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(255, 155, 168, 0.1) 25%, rgba(255, 155, 168, 0.04) 50%, rgba(255, 155, 168, 0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

:root[data-theme="dark"] .skeleton-card {
  background: linear-gradient(90deg, rgba(192, 132, 252, 0.12) 25%, rgba(192, 132, 252, 0.04) 50%, rgba(192, 132, 252, 0.12) 75%);
  background-size: 200% 100%;
}

/* ========== Pet Glass Card ========== */
.pet-glass-card {
  margin-bottom: 20px;
  border-radius: 20px;
  padding: 3px;
  background: linear-gradient(135deg, rgba(255, 155, 168, 0.3) 0%, rgba(192, 132, 252, 0.3) 100%);
}

.pet-glass-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 18px;
}

:root[data-theme="dark"] .pet-glass-inner {
  background: rgba(30, 27, 50, 0.8);
}

.pet-glass-text {
  flex: 1;
  min-width: 0;
}

.pet-glass-name {
  font-size: 18px;
  font-weight: 700;
  color: #2D2D2D;
  display: flex;
  align-items: center;
  gap: 8px;
}

:root[data-theme="dark"] .pet-glass-name {
  color: #FFFFFF;
}

.pet-glass-meta {
  font-size: 13px;
  color: #8B7E9B;
  margin-top: 4px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
}

:root[data-theme="dark"] .pet-glass-meta {
  color: #A9A0C0;
}

.meta-sep {
  margin: 0 6px;
  opacity: 0.5;
}

/* ========== Filter Pill Group ========== */
.filter-bar {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.filter-pill-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-pill {
  padding: 7px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 155, 168, 0.25);
  background: rgba(255, 155, 168, 0.06);
  color: #8B7E9B;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  outline: none;
}

.filter-pill:hover {
  background: rgba(255, 155, 168, 0.12);
  border-color: rgba(255, 155, 168, 0.4);
  color: #FF9BA8;
}

.filter-pill.active {
  background: linear-gradient(135deg, #FF9BA8 0%, #C084FC 100%);
  color: #FFFFFF;
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(255, 155, 168, 0.35);
  font-weight: 600;
}

:root[data-theme="dark"] .filter-pill {
  border-color: rgba(192, 132, 252, 0.2);
  background: rgba(192, 132, 252, 0.06);
  color: #A9A0C0;
}

:root[data-theme="dark"] .filter-pill:hover {
  background: rgba(192, 132, 252, 0.14);
  border-color: rgba(192, 132, 252, 0.4);
  color: #D8B4FE;
}

:root[data-theme="dark"] .filter-pill.active {
  background: linear-gradient(135deg, #C084FC 0%, #A78BFA 100%);
  box-shadow: 0 2px 10px rgba(192, 132, 252, 0.35);
}

/* ========== Timeline Container ========== */
.timeline-container {
  position: relative;
  padding-left: 36px;
}

/* ========== Month Header ========== */
.month-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #FF9BA8;
  background: rgba(255, 155, 168, 0.1);
  padding: 4px 14px;
  border-radius: 10px;
}

:root[data-theme="dark"] .month-badge {
  color: #FFB4C2;
  background: rgba(255, 155, 168, 0.12);
}

.timeline-month-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 28px 0 16px -36px;
  padding-left: 36px;
}

.timeline-month-header:first-child {
  margin-top: 0;
}

/* ========== Timeline Item Entrance ========== */
.timeline-item-entrance {
  opacity: 0;
  transform: translateX(-12px);
  transition: opacity 0.35s ease, transform 0.35s ease;
  transition-delay: var(--item-delay, 0s);
}

.is-mounted .timeline-item-entrance {
  opacity: 1;
  transform: translateX(0);
}

/* ========== Timeline Row ========== */
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

/* ========== Dot Column ========== */
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
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  background: var(--pet-card, #FFFFFF);
  border: 2px solid var(--dot-color, #FF9BA8);
}

:root[data-theme="dark"] .timeline-dot {
  background: #2A2A45;
}

.timeline-dot-icon {
  font-size: 11px;
  line-height: 1;
}

.dot-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid var(--dot-color, #FF9BA8);
  opacity: 0;
  animation: dot-pulse-anim 2s ease-out infinite;
}

.timeline-connector {
  width: 2px;
  flex: 1;
  background: linear-gradient(to bottom, rgba(255, 155, 168, 0.2), rgba(192, 132, 252, 0.1));
  margin-top: 4px;
  min-height: 16px;
}

:root[data-theme="dark"] .timeline-connector {
  background: linear-gradient(to bottom, rgba(192, 132, 252, 0.2), rgba(192, 132, 252, 0.05));
}

.timeline-row:last-child .timeline-connector {
  display: none;
}

/* ========== Timeline Body Card ========== */
.timeline-body {
  flex: 1;
  min-width: 0;
  background: var(--pet-card, #FFFFFF);
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
  cursor: default;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.timeline-body:hover {
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.12);
  transform: translateY(-2px);
  border-color: rgba(255, 155, 168, 0.15);
}

.timeline-row-photo .timeline-body {
  cursor: pointer;
}

.timeline-row-photo .timeline-body:hover {
  box-shadow: 0 6px 20px rgba(192, 132, 252, 0.18);
  border-color: rgba(192, 132, 252, 0.2);
}

:root[data-theme="dark"] .timeline-body {
  background: #2A2A45;
  border-color: rgba(255, 255, 255, 0.04);
}

:root[data-theme="dark"] .timeline-body:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  border-color: rgba(192, 132, 252, 0.15);
}

.timeline-card-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

:root[data-theme="dark"] .timeline-item-title {
  color: #E8E8E8;
}

.completed-title {
  opacity: 0.6;
  text-decoration: line-through;
}

.timeline-item-date {
  font-size: 12px;
  color: #9B8EB8;
  flex-shrink: 0;
  font-weight: 500;
}

:root[data-theme="dark"] .timeline-item-date {
  color: #8B7E9B;
}

.timeline-item-subtitle {
  font-size: 12px;
  color: #6B6B6B;
  margin-top: 2px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:root[data-theme="dark"] .timeline-item-subtitle {
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

:root[data-theme="dark"] .timeline-row-photo .timeline-item-title {
  color: #D8B4FE;
}

.timeline-row-feeding .timeline-item-title {
  color: #D97706;
}

:root[data-theme="dark"] .timeline-row-feeding .timeline-item-title {
  color: #FBBF24;
}

.timeline-row-completed {
  opacity: 0.7;
}

/* ========== Photo preview in timeline ========== */
.timeline-photo-preview {
  margin-top: 10px;
  border-radius: 12px;
  overflow: hidden;
  max-width: 220px;
  max-height: 160px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.timeline-body:hover .timeline-photo-preview {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(192, 132, 252, 0.2);
}

.timeline-photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ========== Lightbox ========== */
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

/* ========== Animations ========== */
@keyframes hero-entrance {
  from {
    opacity: 0;
    transform: translateY(-16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes float-shape-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-6px) rotate(3deg); }
  50% { transform: translateY(-2px) rotate(-2deg); }
  75% { transform: translateY(-8px) rotate(1deg); }
}

@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes skeleton-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes dot-pulse-anim {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.8); opacity: 0; }
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .hero-inner {
    padding: 22px 18px 18px;
  }

  .hero-title {
    font-size: 22px;
  }

  .hero-stats-bar {
    gap: 0;
    padding: 10px 8px;
  }

  .hero-stat-value {
    font-size: 16px;
  }

  .hero-stat-label {
    font-size: 10px;
  }

  .pet-glass-inner {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .pet-glass-name {
    justify-content: center;
  }

  .pet-glass-meta {
    justify-content: center;
  }

  .filter-pill-group {
    justify-content: flex-start;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 4px;
  }

  .filter-pill {
    padding: 6px 12px;
    font-size: 12px;
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
    width: 20px;
    height: 20px;
  }

  .timeline-dot-icon {
    font-size: 9px;
  }

  .timeline-body {
    padding: 10px 14px;
  }

  .timeline-photo-preview {
    max-width: 160px;
  }

  .float-shape {
    font-size: 14px;
    opacity: 0.15;
  }
}

@media (max-width: 480px) {
  .hero-inner {
    padding: 18px 14px 14px;
  }

  .hero-title {
    font-size: 20px;
  }

  .hero-subtitle {
    font-size: 12px;
  }

  .hero-stat-icon {
    font-size: 13px;
  }

  .hero-stat-value {
    font-size: 14px;
  }

  .empty-choose {
    padding: 40px 16px;
  }

  .empty-choose-icon {
    font-size: 40px;
  }

  .empty-choose-title {
    font-size: 16px;
  }

  .timeline-container {
    padding-left: 24px;
  }

  .timeline-month-header {
    margin-left: -24px;
    padding-left: 24px;
  }

  .timeline-dot-col {
    left: -24px;
  }
}
</style>
