<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import { useCountUp } from '@/composables/useCountUp.js';
import { fetchDashboardSummary } from '@/api.js';
import { getEventTypeIcon } from '@/utils/eventTypeIcon.js';
import PetLeaderboard from '@/components/PetLeaderboard.vue';
import {
  NCard,
  NIcon,
  NEmpty,
  NButton,
  NPopconfirm,
  NAvatar,
  useMessage
} from 'naive-ui';
import { AlertCircleOutline } from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();
const message = useMessage();
const { getAvatarUrl } = useCloudinaryImage();

const dashboardData = ref(null);
const loading = ref(true);
const error = ref(false);

// 宠物速览排序（从 localStorage 恢复偏好）
const DASH_SORT_KEY = 'pets_dash_pet_sort';
let _initSort = 'default';
try { _initSort = localStorage.getItem(DASH_SORT_KEY) || 'default'; } catch { /* ignore */ }
const petSortOption = ref(_initSort);
const setDashSortOption = (val) => {
  petSortOption.value = val;
  try { localStorage.setItem(DASH_SORT_KEY, val); } catch { /* ignore */ }
};
const sortedPetOverviews = computed(() => {
  const pets = dashboardData.value?.petOverviews || [];
  if (!pets.length) return [];
  const sorted = [...pets];
  switch (petSortOption.value) {
    case 'likes':
      return sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    case 'pending':
      return sorted.sort((a, b) => (b.pendingEventsCount || 0) - (a.pendingEventsCount || 0));
    case 'age':
      return sorted.sort((a, b) => {
        if (!a.birthday) return 1;
        if (!b.birthday) return -1;
        return a.birthday.localeCompare(b.birthday);
      });
    default:
      return sorted;
  }
});

// 数字滚动动画
const statSource = (key) => computed(() => dashboardData.value?.[key] ?? 0)
const { displayValue: animTotalPets } = useCountUp(statSource('totalPets'), { delay: 200 })
const { displayValue: animPendingEvents } = useCountUp(statSource('pendingEvents'), { delay: 250 })
const { displayValue: animTotalPhotos } = useCountUp(statSource('totalPhotos'), { delay: 300 })
const { displayValue: animTotalWeight } = useCountUp(statSource('totalWeightRecords'), { delay: 350 })
const { displayValue: animTotalHealth } = useCountUp(statSource('totalHealthEvents'), { delay: 400 })
const { displayValue: animTotalFeeding } = useCountUp(statSource('totalFeedings'), { delay: 450 })
const { displayValue: animTotalMedications } = useCountUp(statSource('totalMedications'), { delay: 500 })
const animTotalRecords = computed(() => animTotalHealth.value + animTotalFeeding.value + animTotalWeight.value)

const loadDashboard = async () => {
  loading.value = true;
  error.value = false;
  try {
    const response = await fetchDashboardSummary();
    dashboardData.value = response.data;
  } catch (err) {
    console.error('加载仪表盘数据失败:', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(loadDashboard);

const handleShowDetail = (petId) => {
  petStore.showDetailModal(petId);
};

const handleCompleteEvent = async (eventId) => {
  if (!authStore.isAuthenticated) return;
  try {
    await petStore.handleCompleteHealthEvent(eventId);
    await loadDashboard();
  } catch (err) {
    console.error('操作失败:', err);
  }
};

const getActivityColor = (type) => {
  const map = { weight: '#7DD3FC', health: '#FCA5A5', feeding: '#FBBF24', photo: '#C084FC', medication: '#A78BFA', bathing: '#67E8F9' };
  return map[type] || '#9CA3AF';
};

const getDaysBadgeClass = (daysLeft) => {
  if (daysLeft < 0) return 'days-overdue';
  if (daysLeft === 0) return 'days-today';
  if (daysLeft <= 2) return 'days-warning';
  return 'days-normal';
};

const getDaysTagType = (daysLeft) => {
  if (daysLeft < 0) return 'error';
  if (daysLeft <= 2) return 'warning';
  return 'success';
};

const getDaysText = (daysLeft) => {
  if (daysLeft < 0) return '天前';
  if (daysLeft === 0) return '今天';
  return '天后';
};

const getDaysDisplay = (daysLeft) => {
  if (daysLeft < 0) return Math.abs(daysLeft);
  return daysLeft;
};

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const timeEmoji = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '🌙';
  if (hour < 12) return '☀️';
  if (hour < 14) return '🌤️';
  if (hour < 18) return '🌅';
  return '🌆';
});

// 快捷操作处理
const handleQuickAction = (action) => {
  const pets = dashboardData.value?.petOverviews || [];

  switch (action) {
    case 'addPet':
      if (!authStore.isAuthenticated) {
        message.warning('请先登录后再添加宠物');
        return;
      }
      petStore.activePage = 'pets';
      setTimeout(() => petStore.showPetFormModal(null), 300);
      break;

    case 'addWeight':
      if (!pets.length) {
        message.warning('请先添加一只宠物');
        return;
      }
      if (!authStore.isAuthenticated) {
        message.warning('请先登录后再记录体重');
        return;
      }
      if (pets.length === 1) {
        petStore.showWeightLogFormModal(pets[0].id);
      } else {
        petStore.activePage = 'pets';
        message.info('请先选择要记录体重的宠物，点击宠物详情后操作');
      }
      break;

    case 'addHealthEvent':
      if (!pets.length) {
        message.warning('请先添加一只宠物');
        return;
      }
      if (!authStore.isAuthenticated) {
        message.warning('请先登录后再添加健康事件');
        return;
      }
      if (pets.length === 1) {
        petStore.showHealthEventFormModal(pets[0].id);
      } else {
        petStore.activePage = 'pets';
        message.info('请先选择要记录健康事件的宠物，点击宠物详情后操作');
      }
      break;

    case 'addFeeding':
      petStore.activePage = 'feeding';
      break;

    case 'medication':
      petStore.activePage = 'medication';
      break;

    case 'album':
      petStore.navigateToAlbum();
      break;

    case 'timeline':
      petStore.navigateToTimeline();
      break;
  }
};

const maxFeedingCount = computed(() => {
  const stats = dashboardData.value?.feedingStats || [];
  if (!stats.length) return 1;
  return Math.max(...stats.map(s => s.count), 1);
});

const getFeedingBarWidth = (count) => {
  return Math.round((count / maxFeedingCount.value) * 100);
};

const computeAge = (birthday) => {
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
};
</script>

<template>
  <div class="dashboard">
    <!-- 沉浸式 Hero 区域 -->
    <div class="dashboard-hero">
        <div class="hero-bg-shapes">
          <span class="hero-shape shape-1">🐾</span>
          <span class="hero-shape shape-2">🌸</span>
          <span class="hero-shape shape-3">💫</span>
          <span class="hero-shape shape-4">🐾</span>
          <span class="hero-shape shape-5">✨</span>
          <span class="hero-shape shape-6">🦋</span>
        </div>
        <div class="hero-glass-card">
          <div class="hero-content">
            <div class="hero-greeting-row">
              <span class="hero-time-icon">{{ timeEmoji }}</span>
              <span class="hero-greeting">{{ greeting }}{{ authStore.userInfo?.username ? '，' + authStore.userInfo.username : '' }}</span>
            </div>
            <h1 class="hero-title">萌宠之家</h1>
            <p class="hero-subtitle">记录每一个温暖的瞬间</p>
            <!-- Hero 统计条 - 加载骨架 -->
            <div v-if="loading" class="hero-stats-strip">
              <div v-for="i in 4" :key="i" class="hero-stat-pill">
                <span class="dash-skeleton-pill" style="width: 24px; height: 18px;"></span>
                <span class="dash-skeleton-pill" style="width: 24px; height: 12px; margin-top: 2px;"></span>
              </div>
            </div>
            <!-- Hero 统计条 - 实际数据 -->
            <div v-else-if="dashboardData" class="hero-stats-strip">
              <div class="hero-stat-pill">
                <span class="hero-stat-num">{{ animTotalPets }}</span>
                <span class="hero-stat-lbl">宠物</span>
              </div>
              <span class="hero-stat-divider"></span>
              <div class="hero-stat-pill">
                <span class="hero-stat-num">{{ animTotalPhotos }}</span>
                <span class="hero-stat-lbl">照片</span>
              </div>
              <span class="hero-stat-divider"></span>
              <div class="hero-stat-pill">
                <span class="hero-stat-num">{{ animTotalRecords }}</span>
                <span class="hero-stat-lbl">记录</span>
              </div>
              <span v-if="dashboardData.pendingEvents > 0" class="hero-stat-divider"></span>
              <div v-if="dashboardData.pendingEvents > 0" class="hero-stat-pill hero-stat-pending">
                <span class="hero-stat-num">{{ animPendingEvents }}</span>
                <span class="hero-stat-lbl">待处理</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 骨架屏 shimmer ===== -->
      <div v-if="loading" class="dash-skeleton-wrap">
        <!-- 统计卡片骨架 -->
        <div class="dash-skel-stats">
          <div v-for="i in 6" :key="i" class="dash-skel-stat-card" :style="{ animationDelay: (i * 0.04) + 's' }">
            <div class="dash-skel-stat-icon"></div>
            <div class="dash-skel-pill" style="width: 36px; height: 22px;"></div>
            <div class="dash-skel-pill" style="width: 48px; height: 10px;"></div>
          </div>
        </div>
        <!-- 快捷操作骨架 -->
        <div class="dash-skel-section">
          <div class="dash-skel-section-header">
            <div class="dash-skel-pill" style="width: 72px; height: 16px;"></div>
          </div>
          <div class="dash-skel-quick-actions">
            <div v-for="i in 7" :key="i" class="dash-skel-qa-card" :style="{ animationDelay: (i * 0.04) + 's' }">
              <div class="dash-skel-qa-icon"></div>
              <div class="dash-skel-pill" style="width: 40px; height: 10px;"></div>
            </div>
          </div>
        </div>
        <!-- 宠物速览骨架 -->
        <div class="dash-skel-section">
          <div class="dash-skel-section-header">
            <div class="dash-skel-pill" style="width: 60px; height: 16px;"></div>
          </div>
          <div class="dash-skel-pets">
            <div v-for="i in 3" :key="i" class="dash-skel-pet-card" :style="{ animationDelay: (i * 0.06) + 's' }">
              <div class="dash-skel-pet-header">
                <div class="dash-skel-avatar"></div>
                <div class="dash-skel-pet-info">
                  <div class="dash-skel-pill" style="width: 56px; height: 14px;"></div>
                  <div class="dash-skel-pill" style="width: 80px; height: 10px; margin-top: 6px;"></div>
                </div>
              </div>
              <div class="dash-skel-pet-meta">
                <div class="dash-skel-pill" style="width: 64px; height: 10px;"></div>
                <div class="dash-skel-pill" style="width: 48px; height: 10px;"></div>
              </div>
            </div>
          </div>
        </div>
        <!-- 事件 + 活动双栏骨架 -->
        <div class="dash-skel-two-col">
          <div class="dash-skel-section">
            <div class="dash-skel-section-header">
              <div class="dash-skel-pill" style="width: 100px; height: 16px;"></div>
            </div>
            <div class="dash-skel-events">
              <div v-for="i in 3" :key="i" class="dash-skel-event-item" :style="{ animationDelay: (i * 0.05) + 's' }">
                <div class="dash-skel-event-badge"></div>
                <div class="dash-skel-event-info">
                  <div class="dash-skel-pill" style="width: 80px; height: 12px;"></div>
                  <div class="dash-skel-pill" style="width: 120px; height: 10px; margin-top: 6px;"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="dash-skel-section">
            <div class="dash-skel-section-header">
              <div class="dash-skel-pill" style="width: 60px; height: 16px;"></div>
            </div>
            <div class="dash-skel-events">
              <div v-for="i in 4" :key="i" class="dash-skel-event-item" :style="{ animationDelay: (i * 0.05) + 's' }">
                <div class="dash-skel-dot"></div>
                <div class="dash-skel-event-info">
                  <div class="dash-skel-pill" style="width: 100px; height: 12px;"></div>
                  <div class="dash-skel-pill" style="width: 60px; height: 10px; margin-top: 6px;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template v-else-if="dashboardData">
        <!-- 统计卡片 -->
        <div class="stats-row">
          <div class="stat-card stat-pets" style="--stat-delay: 0s">
            <div class="stat-icon-wrap"><span class="stat-icon">🐾</span></div>
            <div class="stat-value">{{ animTotalPets }}</div>
            <div class="stat-label">我的萌宠</div>
            <div class="stat-glow"></div>
          </div>
          <div class="stat-card stat-events" style="--stat-delay: 0.05s">
            <div class="stat-icon-wrap"><span class="stat-icon">📋</span></div>
            <div class="stat-value">{{ animPendingEvents }}</div>
            <div class="stat-label">待处理事件</div>
            <div class="stat-glow"></div>
          </div>
          <div class="stat-card stat-photos" style="--stat-delay: 0.1s">
            <div class="stat-icon-wrap"><span class="stat-icon">📷</span></div>
            <div class="stat-value">{{ animTotalPhotos }}</div>
            <div class="stat-label">相册照片</div>
            <div class="stat-glow"></div>
          </div>
          <div class="stat-card stat-weight" style="--stat-delay: 0.15s">
            <div class="stat-icon-wrap"><span class="stat-icon">⚖️</span></div>
            <div class="stat-value">{{ animTotalWeight }}</div>
            <div class="stat-label">体重记录</div>
            <div class="stat-glow"></div>
          </div>
          <div class="stat-card stat-health" style="--stat-delay: 0.2s">
            <div class="stat-icon-wrap"><span class="stat-icon">🩺</span></div>
            <div class="stat-value">{{ animTotalHealth }}</div>
            <div class="stat-label">健康事件</div>
            <div class="stat-glow"></div>
          </div>
          <div class="stat-card stat-medication" style="--stat-delay: 0.25s">
            <div class="stat-icon-wrap"><span class="stat-icon">💊</span></div>
            <div class="stat-value">{{ animTotalMedications }}</div>
            <div class="stat-label">用药记录</div>
            <div class="stat-glow"></div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions-section section-entrance" style="--enter-delay: 0.08s">
          <div class="section-header">
            <span class="section-emoji">⚡</span>
            <span class="section-title">快捷操作</span>
          </div>
          <div class="quick-actions-row">
            <div class="quick-action-card" style="--qa-delay: 0s" @click="handleQuickAction('addPet')">
              <div class="quick-action-icon add-pet-icon">🐾</div>
              <span class="quick-action-label">添加宠物</span>
            </div>
            <div
              class="quick-action-card"
              style="--qa-delay: 0.04s"
              :class="{ 'quick-action-disabled': !dashboardData.petOverviews?.length }"
              @click="handleQuickAction('addWeight')"
            >
              <div class="quick-action-icon add-weight-icon">⚖️</div>
              <span class="quick-action-label">记录体重</span>
            </div>
            <div
              class="quick-action-card"
              style="--qa-delay: 0.08s"
              :class="{ 'quick-action-disabled': !dashboardData.petOverviews?.length }"
              @click="handleQuickAction('addHealthEvent')"
            >
              <div class="quick-action-icon add-health-icon">🩺</div>
              <span class="quick-action-label">健康事件</span>
            </div>
            <div
              class="quick-action-card"
              style="--qa-delay: 0.12s"
              :class="{ 'quick-action-disabled': !dashboardData.petOverviews?.length }"
              @click="handleQuickAction('addFeeding')"
            >
              <div class="quick-action-icon add-feeding-icon">🍽️</div>
              <span class="quick-action-label">记录喂养</span>
            </div>
            <div class="quick-action-card" style="--qa-delay: 0.16s" @click="handleQuickAction('medication')">
              <div class="quick-action-icon medication-icon">💊</div>
              <span class="quick-action-label">用药记录</span>
            </div>
            <div class="quick-action-card" style="--qa-delay: 0.2s" @click="handleQuickAction('album')">
              <div class="quick-action-icon album-icon">📷</div>
              <span class="quick-action-label">宠物相册</span>
            </div>
            <div class="quick-action-card" style="--qa-delay: 0.24s" @click="handleQuickAction('timeline')">
              <div class="quick-action-icon timeline-icon">📈</div>
              <span class="quick-action-label">成长时间线</span>
            </div>
          </div>
        </div>

        <!-- 萌宠点赞榜 -->
        <div class="section-entrance" style="--enter-delay: 0.12s">
          <PetLeaderboard v-if="dashboardData.totalPets > 0" />
        </div>

        <!-- 宠物速览 -->
        <div v-if="dashboardData.petOverviews?.length" class="pet-overviews-section section-entrance" style="--enter-delay: 0.16s">
          <div class="pet-overviews-header">
            <div class="section-header">
              <span class="section-emoji">🐾</span>
              <span class="section-title">我的宠物</span>
            </div>
            <div class="pet-sort-bar">
              <button
                v-for="opt in [
                  { key: 'default', label: '默认' },
                  { key: 'likes', label: '❤️ 热门' },
                  { key: 'pending', label: '📋 待办' },
                  { key: 'age', label: '🎂 年龄' },
                ]"
                :key="opt.key"
                :class="['pet-sort-pill', { active: petSortOption === opt.key }]"
                @click="setDashSortOption(opt.key)"
              >{{ opt.label }}</button>
            </div>
          </div>
          <div class="pet-overviews-row">
            <div
              v-for="pet in sortedPetOverviews"
              :key="pet.id"
              class="pet-overview-card"
              @click="handleShowDetail(pet.id)"
            >
              <div class="pet-overview-header">
                <n-avatar
                  v-if="pet.avatarUrl"
                  round
                  :size="44"
                  :src="getAvatarUrl(pet.avatarUrl)"
                  class="pet-overview-avatar-img"
                />
                <span v-else class="pet-overview-avatar">{{ pet.gender === 'male' ? '♂️' : pet.gender === 'female' ? '♀️' : '🐾' }}</span>
                <div class="pet-overview-name-wrap">
                  <span class="pet-overview-name">{{ pet.name }}</span>
                  <span v-if="pet.speciesName || pet.breedName" class="pet-overview-breed">
                    {{ pet.speciesName }}{{ pet.breedName ? ' · ' + pet.breedName : '' }}
                  </span>
                </div>
              </div>
              <div class="pet-overview-meta">
                <div v-if="pet.birthday" class="pet-meta-item">
                  <span class="pet-meta-icon">🎂</span>
                  <span>{{ computeAge(pet.birthday) }}</span>
                </div>
                <div v-if="pet.latestWeight" class="pet-meta-item">
                  <span class="pet-meta-icon">⚖️</span>
                  <span>{{ pet.latestWeight }}</span>
                </div>
                <div v-if="pet.likeCount > 0" class="pet-meta-item pet-meta-likes">
                  <span class="pet-meta-icon">❤️</span>
                  <span>{{ pet.likeCount }}</span>
                </div>
                <div v-if="pet.pendingEventsCount > 0" class="pet-meta-item pet-meta-pending">
                  <span class="pet-meta-icon">📋</span>
                  <span>{{ pet.pendingEventsCount }} 个待处理</span>
                </div>
              </div>
              <div class="pet-overview-arrow">›</div>
            </div>
          </div>
        </div>

        <!-- 近期喂养概况 -->
        <div v-if="dashboardData.feedingStats?.length" class="feeding-stats-section section-entrance" style="--enter-delay: 0.2s">
          <div class="section-header">
            <span class="section-emoji">🍽️</span>
            <span class="section-title">近期喂养概况</span>
            <span class="section-subtitle">最近 30 天</span>
          </div>
          <n-card :bordered="false" class="feeding-stats-card">
            <div class="feeding-stats-list">
              <div
                v-for="stat in dashboardData.feedingStats"
                :key="stat.foodType"
                class="feeding-stat-item"
              >
                <div class="feeding-stat-header">
                  <span class="feeding-stat-name">{{ stat.foodType }}</span>
                  <span class="feeding-stat-count">
                    {{ stat.count }} 次
                    <span v-if="stat.avgAmount" class="feeding-stat-avg">· 均 {{ stat.avgAmount }}g</span>
                  </span>
                </div>
                <div class="feeding-stat-bar-bg">
                  <div
                    class="feeding-stat-bar"
                    :style="{ width: getFeedingBarWidth(stat.count) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </n-card>
        </div>

        <!-- 即将到期事件 -->
        <div class="events-section section-entrance" style="--enter-delay: 0.24s">
          <div class="section-header events-section-header">
            <span class="section-emoji">📅</span>
            <span class="section-title">即将到期的事件</span>
            <span v-if="petStore.upcomingEvents.length" class="section-count-badge events-badge">
              {{ petStore.upcomingEvents.length }}
            </span>
          </div>
          <div class="events-glass-container">
            <!-- 骨架屏 -->
            <div v-if="petStore.loadingUpcoming" class="events-skeleton">
              <div v-for="i in 3" :key="i" class="event-skeleton-item">
                <div class="skeleton-days-badge"></div>
                <div class="skeleton-info">
                  <div class="skeleton-line skeleton-line-short"></div>
                  <div class="skeleton-line skeleton-line-long"></div>
                </div>
              </div>
            </div>
            <!-- 数据 -->
            <div v-else-if="petStore.upcomingEvents.length" class="event-list">
              <div
                v-for="(event, idx) in petStore.upcomingEvents.slice(0, 5)"
                :key="event.id"
                class="event-item"
                :class="{ 'event-overdue': event.isOverdue }"
                :style="{ animationDelay: (idx * 0.06) + 's' }"
                @click="handleShowDetail(event.petId)"
              >
                <div class="event-days-badge" :class="getDaysBadgeClass(event.daysLeft)">
                  <span class="event-days-number">{{ getDaysDisplay(event.daysLeft) }}</span>
                  <span class="event-days-text">{{ getDaysText(event.daysLeft) }}</span>
                </div>
                <div class="event-info">
                  <div class="event-info-top">
                    <span class="event-pet-name">{{ event.petName }}</span>
                    <span class="event-type-icon">{{ getEventTypeIcon(event.eventTypeLabel) }}</span>
                    <span class="event-type-tag" :class="'tag-' + getDaysTagType(event.daysLeft)">
                      {{ event.eventTypeLabel }}
                    </span>
                  </div>
                  <div class="event-info-bottom">
                    <span class="event-notes">{{ event.notes || '待处理' }}</span>
                    <span class="event-date">{{ event.nextDueDate }}</span>
                  </div>
                </div>
                <n-popconfirm
                  @positive-click="handleCompleteEvent(event.id)"
                  :positive-button-props="{ type: 'success', size: 'tiny' }"
                  :negative-button-props="{ size: 'tiny' }"
                >
                  <template #trigger>
                    <span
                      class="event-complete-btn"
                      :class="{ 'btn-disabled': !authStore.isAuthenticated }"
                      @click.stop
                    >
                      ✓
                    </span>
                  </template>
                  标记此事件为已完成？
                </n-popconfirm>
                <span class="event-arrow">›</span>
              </div>
            </div>
            <!-- 空状态 -->
            <div v-else class="events-empty">
              <span class="empty-emoji">🎉</span>
              <span class="empty-text">太棒了！没有需要提醒的事件～</span>
              <span class="empty-stars">✨</span>
            </div>
          </div>
        </div>

        <!-- 最近活动 -->
        <div class="activities-section section-entrance" style="--enter-delay: 0.28s">
          <div class="section-header activities-section-header">
            <span class="section-emoji">🕐</span>
            <span class="section-title">最近活动</span>
          </div>
          <div class="activities-glass-container">
            <div v-if="dashboardData.recentActivities?.length" class="activity-list">
              <div
                v-for="(item, idx) in dashboardData.recentActivities"
                :key="item.id"
                class="activity-item"
                :style="{ animationDelay: (idx * 0.05) + 's' }"
              >
                <div class="activity-dot" :style="{ background: getActivityColor(item.type) }">
                  <span class="activity-icon">{{ item.icon }}</span>
                </div>
                <div class="activity-content">
                  <div class="activity-header">
                    <span class="activity-pet-name">{{ item.petName }}</span>
                    <span class="activity-date">{{ item.date }}</span>
                  </div>
                  <span class="activity-title">{{ item.title }}</span>
                </div>
              </div>
            </div>
            <div v-else class="activities-empty">
              <span class="empty-emoji">📝</span>
              <span class="empty-text">暂无最近活动，快去记录萌宠的生活吧！</span>
              <span class="empty-stars">✨</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 加载失败 -->
      <n-card v-else-if="error" class="section-card" :bordered="false">
        <n-empty description="加载仪表盘数据失败，请稍后重试" size="large">
          <template #icon>
            <n-icon :component="AlertCircleOutline" size="40" color="#FCA5A5" />
          </template>
          <template #extra>
            <n-button type="primary" @click="loadDashboard" round>
              重新加载
            </n-button>
          </template>
        </n-empty>
      </n-card>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 0 auto;
}

/* ===== 沉浸式 Hero 区域 ===== */
.dashboard-hero {
  position: relative;
  margin-bottom: 28px;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 30%, #D8B4FE 60%, #C084FC 100%);
  padding: 3px;
  animation: hero-entrance 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

:global(.dark-mode) .dashboard-hero {
  background: linear-gradient(135deg, #FF7A8A 0%, #C084FC 50%, #7DD3FC 100%);
}

.hero-bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 24px;
  z-index: 1;
}

.hero-shape {
  position: absolute;
  opacity: 0.15;
  animation: float-shape 8s ease-in-out infinite;
  font-size: 24px;
  user-select: none;
}

:global(.dark-mode) .hero-shape {
  opacity: 0.2;
}

.shape-1 { top: 10%; left: 5%; animation-delay: 0s; font-size: 28px; }
.shape-2 { top: 20%; right: 12%; animation-delay: -2s; font-size: 20px; }
.shape-3 { bottom: 15%; left: 20%; animation-delay: -4s; font-size: 18px; }
.shape-4 { bottom: 25%; right: 6%; animation-delay: -1s; font-size: 22px; }
.shape-5 { top: 50%; left: 45%; animation-delay: -3s; font-size: 16px; }
.shape-6 { top: 8%; left: 55%; animation-delay: -5s; font-size: 14px; }

.hero-glass-card {
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 22px;
  padding: 40px 36px 32px;
}

:global(.dark-mode) .hero-glass-card {
  background: rgba(30, 30, 56, 0.88);
}

.hero-content {
  text-align: center;
}

.hero-greeting-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hero-time-icon {
  font-size: 22px;
  animation: gentle-bounce 3s ease-in-out infinite;
}

.hero-greeting {
  font-size: 15px;
  font-weight: 600;
  color: #9CA3AF;
  letter-spacing: 0.02em;
}

:global(.dark-mode) .hero-greeting {
  color: #8888A0;
}

.hero-title {
  font-size: 36px;
  font-weight: 900;
  margin: 0 0 8px;
  background: linear-gradient(135deg, #FF7A8A 0%, #C084FC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

:global(.dark-mode) .hero-title {
  background: linear-gradient(135deg, #FFB4C2 0%, #D8B4FE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 15px;
  color: #9CA3AF;
  margin: 0 0 20px;
  font-weight: 500;
}

:global(.dark-mode) .hero-subtitle {
  color: #8888A0;
}

.hero-stats-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 155, 168, 0.08);
  border-radius: 16px;
  margin-top: 4px;
  animation: strip-fade-in 0.6s 0.4s ease both;
}

:global(.dark-mode) .hero-stats-strip {
  background: rgba(255, 155, 168, 0.06);
}

.hero-stat-pill {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.hero-stat-num {
  font-size: 20px;
  font-weight: 800;
  color: #2D2D2D;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  min-width: 1.5ch;
  display: inline-block;
  text-align: right;
}

:global(.dark-mode) .hero-stat-num {
  color: #F0F0F0;
}

.hero-stat-lbl {
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
}

:global(.dark-mode) .hero-stat-lbl {
  color: #8888A0;
}

.hero-stat-divider {
  width: 1px;
  height: 16px;
  background: rgba(156, 163, 175, 0.3);
  border-radius: 1px;
}

.hero-stat-pending .hero-stat-num {
  color: #D97706;
}

:global(.dark-mode) .hero-stat-pending .hero-stat-num {
  color: #FCD34D;
}

/* ===== 区块入场动画 ===== */
.section-entrance {
  animation: section-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--enter-delay, 0s);
}

@keyframes hero-entrance {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes strip-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes section-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float-shape {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(5deg); }
  50% { transform: translateY(-4px) rotate(-3deg); }
  75% { transform: translateY(-10px) rotate(2deg); }
}

@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 移动端 Hero 响应式 */
@media (max-width: 768px) {
  .dashboard-hero {
    border-radius: 20px;
  }

  .hero-glass-card {
    padding: 28px 20px 24px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 13px;
    margin-bottom: 16px;
  }

  .hero-stats-strip {
    gap: 8px;
    padding: 10px 12px;
    flex-wrap: wrap;
  }

  .hero-stat-num {
    font-size: 18px;
  }
}

/* 统计卡片 - 毛玻璃版 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (min-width: 769px) {
  .stats-row {
    grid-template-columns: repeat(6, 1fr);
  }
}

.stat-card {
  text-align: center;
  border-radius: 20px;
  padding: 26px 16px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease;
  animation: stat-card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--stat-delay, 0s);
}

@keyframes stat-card-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.stat-glow {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.stat-card:hover {
  transform: translateY(-5px) scale(1.03);
}

.stat-card:hover .stat-glow {
  opacity: 1;
}

.stat-pets {
  background: rgba(255, 240, 243, 0.55);
  border-color: rgba(255, 200, 210, 0.4);
}
.stat-pets .stat-glow { box-shadow: 0 8px 32px rgba(255, 155, 168, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.5); }

.stat-events {
  background: rgba(254, 249, 215, 0.55);
  border-color: rgba(253, 230, 138, 0.4);
}
.stat-events .stat-glow { box-shadow: 0 8px 32px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5); }

.stat-photos {
  background: rgba(245, 240, 255, 0.55);
  border-color: rgba(221, 214, 254, 0.4);
}
.stat-photos .stat-glow { box-shadow: 0 8px 32px rgba(167, 139, 250, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5); }

.stat-weight {
  background: rgba(230, 245, 255, 0.55);
  border-color: rgba(186, 230, 253, 0.4);
}
.stat-weight .stat-glow { box-shadow: 0 8px 32px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5); }

.stat-health {
  background: rgba(252, 238, 245, 0.55);
  border-color: rgba(251, 207, 232, 0.4);
}
.stat-health .stat-glow { box-shadow: 0 8px 32px rgba(244, 114, 182, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5); }

.stat-medication {
  background: rgba(245, 240, 255, 0.55);
  border-color: rgba(196, 181, 253, 0.4);
}
.stat-medication .stat-glow { box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5); }

:global(.dark-mode) .stat-pets {
  background: rgba(61, 32, 37, 0.55);
  border-color: rgba(120, 60, 70, 0.4);
}
:global(.dark-mode) .stat-events {
  background: rgba(61, 53, 32, 0.55);
  border-color: rgba(120, 100, 50, 0.4);
}
:global(.dark-mode) .stat-photos {
  background: rgba(45, 32, 64, 0.55);
  border-color: rgba(100, 70, 140, 0.4);
}
:global(.dark-mode) .stat-weight {
  background: rgba(30, 42, 58, 0.55);
  border-color: rgba(56, 100, 140, 0.4);
}
:global(.dark-mode) .stat-health {
  background: rgba(58, 29, 46, 0.55);
  border-color: rgba(120, 50, 90, 0.4);
}
:global(.dark-mode) .stat-medication {
  background: rgba(45, 32, 64, 0.55);
  border-color: rgba(100, 70, 140, 0.4);
}
:global(.dark-mode) .stat-pets .stat-glow { box-shadow: 0 8px 32px rgba(255, 100, 120, 0.15); }
:global(.dark-mode) .stat-events .stat-glow { box-shadow: 0 8px 32px rgba(251, 191, 36, 0.12); }
:global(.dark-mode) .stat-photos .stat-glow { box-shadow: 0 8px 32px rgba(167, 139, 250, 0.12); }
:global(.dark-mode) .stat-weight .stat-glow { box-shadow: 0 8px 32px rgba(56, 189, 248, 0.12); }
:global(.dark-mode) .stat-health .stat-glow { box-shadow: 0 8px 32px rgba(244, 114, 182, 0.12); }
:global(.dark-mode) .stat-medication .stat-glow { box-shadow: 0 8px 32px rgba(139, 92, 246, 0.12); }

.stat-icon-wrap {
  margin-bottom: 10px;
}

.stat-icon {
  font-size: 32px;
  display: inline-block;
  transition: transform 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.15);
  animation: stat-icon-bounce 0.5s ease;
}

@keyframes stat-icon-bounce {
  0%, 100% { transform: scale(1.15); }
  50% { transform: scale(1.3); }
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: #2D2D2D;
  line-height: 1;
  margin-bottom: 6px;
  background: linear-gradient(135deg, #2D2D2D 0%, #555 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-variant-numeric: tabular-nums;
  min-width: 2ch;
  text-align: center;
}

:global(.dark-mode) .stat-value {
  background: linear-gradient(135deg, #E8E8E8 0%, #B8B8CC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 13px;
  color: #7B7B8B;
  font-weight: 500;
  letter-spacing: 0.3px;
}

:global(.dark-mode) .stat-label {
  color: #A0A0B8;
}

/* 宠物速览 - 毛玻璃版 */
.pet-overviews-section {
  margin-bottom: 20px;
}

.pet-overviews-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 8px;
}

.pet-overviews-header .section-header {
  margin-bottom: 0;
}

.pet-sort-bar {
  display: flex;
  gap: 6px;
}

.pet-sort-pill {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  white-space: nowrap;
  user-select: none;
}

.pet-sort-pill:hover {
  background: rgba(255, 255, 255, 0.75);
  color: #374151;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.pet-sort-pill.active {
  background: linear-gradient(135deg, #F472B6 0%, #FB923C 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 10px rgba(244, 114, 182, 0.3);
}

:global(.dark-mode) .pet-sort-pill {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  color: #A0A0B8;
}

:global(.dark-mode) .pet-sort-pill:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #D1D5DB;
}

:global(.dark-mode) .pet-sort-pill.active {
  background: linear-gradient(135deg, #F472B6 0%, #FB923C 100%);
  color: #fff;
  border-color: transparent;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.section-emoji {
  font-size: 20px;
}

.pet-overviews-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.pet-overview-card {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 18px;
  padding: 18px;
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, border-color 0.3s ease, background 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.35);
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  animation: pet-card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.pet-overview-card:nth-child(1) { animation-delay: 0s; }
.pet-overview-card:nth-child(2) { animation-delay: 0.06s; }
.pet-overview-card:nth-child(3) { animation-delay: 0.12s; }
.pet-overview-card:nth-child(4) { animation-delay: 0.18s; }
.pet-overview-card:nth-child(5) { animation-delay: 0.24s; }
.pet-overview-card:nth-child(6) { animation-delay: 0.3s; }

@keyframes pet-card-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.pet-overview-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 10px 32px rgba(255, 155, 168, 0.18);
  border-color: rgba(255, 200, 215, 0.6);
  background: rgba(255, 255, 255, 0.6);
}

:global(.dark-mode) .pet-overview-card {
  background: rgba(35, 35, 65, 0.55);
  border-color: rgba(80, 80, 120, 0.35);
}

:global(.dark-mode) .pet-overview-card:hover {
  background: rgba(45, 45, 80, 0.65);
  border-color: rgba(120, 100, 180, 0.45);
  box-shadow: 0 10px 32px rgba(120, 100, 200, 0.15);
}

.pet-overview-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pet-overview-avatar {
  font-size: 28px;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFE4E9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pet-overview-avatar-img {
  flex-shrink: 0;
  border: 2px solid #FFE4E9;
}

:global(.dark-mode) .pet-overview-avatar {
  background: linear-gradient(135deg, #3D2025 0%, #4D2030 100%);
}

:global(.dark-mode) .pet-overview-avatar-img {
  border-color: #3D3D5C;
}

.pet-overview-name-wrap {
  min-width: 0;
}

.pet-overview-name {
  font-weight: 700;
  font-size: 16px;
  color: #2D2D2D;
  display: block;
}

:global(.dark-mode) .pet-overview-name {
  color: #E8E8E8;
}

.pet-overview-breed {
  font-size: 12px;
  color: #9CA3AF;
  display: block;
  margin-top: 2px;
}

:global(.dark-mode) .pet-overview-breed {
  color: #8888A0;
}

.pet-overview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.pet-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6B6B6B;
}

:global(.dark-mode) .pet-meta-item {
  color: #B8B8CC;
}

.pet-meta-icon {
  font-size: 14px;
}

.pet-meta-pending {
  color: #D97706;
  font-weight: 600;
}

:global(.dark-mode) .pet-meta-pending {
  color: #FCD34D;
}

.pet-meta-likes {
  color: #E11D48;
  font-weight: 600;
}

:global(.dark-mode) .pet-meta-likes {
  color: #FB7185;
}

.pet-overview-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: #D1D5DB;
  font-weight: 300;
  transition: all 0.3s ease;
}

.pet-overview-card:hover .pet-overview-arrow {
  transform: translateY(-50%) translateX(4px);
  color: #FF9BA8;
}

:global(.dark-mode) .pet-overview-arrow {
  color: #555;
}

/* ===== 事件提醒区域 ===== */
.events-section,
.activities-section {
  margin-bottom: 20px;
}

.events-section-header,
.activities-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.section-count-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
  line-height: 1.4;
}

.events-badge {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.events-glass-container,
.activities-glass-container {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

:global(.dark-mode) .events-glass-container,
:global(.dark-mode) .activities-glass-container {
  background: rgba(26, 26, 50, 0.72);
  border-color: rgba(60, 60, 90, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

/* 事件列表 */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  border: 1px solid rgba(255, 155, 168, 0.08);
  animation: item-slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.event-item:hover {
  transform: translateX(6px);
  box-shadow: 0 6px 24px rgba(255, 155, 168, 0.18);
  border-color: rgba(255, 155, 168, 0.25);
  background: rgba(255, 255, 255, 0.9);
}

:global(.dark-mode) .event-item {
  background: rgba(30, 30, 56, 0.6);
  border-color: rgba(60, 60, 90, 0.3);
}

:global(.dark-mode) .event-item:hover {
  background: rgba(30, 30, 56, 0.85);
  border-color: rgba(90, 90, 120, 0.5);
}

.event-days-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.event-item:hover .event-days-badge {
  transform: scale(1.05);
}

.event-days-number {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.event-days-text {
  font-size: 10px;
  font-weight: 600;
  margin-top: 2px;
}

.days-overdue {
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  color: #DC2626;
}

.days-today {
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  color: #DC2626;
}

.days-warning {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  color: #D97706;
}

.days-normal {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #059669;
}

.event-overdue {
  border-left: 3px solid #DC2626;
}

.event-overdue:hover {
  box-shadow: 0 6px 24px rgba(220, 38, 38, 0.15);
  border-color: #DC2626;
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-info-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.event-pet-name {
  font-weight: 700;
  color: #2D2D2D;
  font-size: 15px;
}

:global(.dark-mode) .event-pet-name {
  color: #E8E8E8;
}

.event-info-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.event-notes {
  color: #6B6B6B;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

:global(.dark-mode) .event-notes {
  color: #B8B8CC;
}

.event-date {
  color: #9CA3AF;
  font-size: 12px;
  flex-shrink: 0;
}

:global(.dark-mode) .event-date {
  color: #8888A0;
}

.event-type-icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.event-type-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  line-height: 1.4;
}

.tag-success {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #059669;
}

.tag-warning {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  color: #D97706;
}

.tag-error {
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  color: #DC2626;
}

:global(.dark-mode) .tag-success {
  background: linear-gradient(135deg, #064E3B 0%, #065F46 100%);
  color: #6EE7B7;
}

:global(.dark-mode) .tag-warning {
  background: linear-gradient(135deg, #78350F 0%, #92400E 100%);
  color: #FCD34D;
}

:global(.dark-mode) .tag-error {
  background: linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%);
  color: #FCA5A5;
}

.event-arrow {
  font-size: 20px;
  color: #D1D5DB;
  font-weight: 300;
  transition: all 0.3s ease;
}

.event-item:hover .event-arrow {
  transform: translateX(4px);
  color: #FF9BA8;
}

:global(.dark-mode) .event-arrow {
  color: #555;
}

.event-complete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #059669;
  font-size: 14px;
  font-weight: 700;
  opacity: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.event-item:hover .event-complete-btn {
  opacity: 1;
}

.event-complete-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
}

.btn-disabled {
  opacity: 0 !important;
  cursor: not-allowed;
}

:global(.dark-mode) .event-complete-btn {
  background: linear-gradient(135deg, #064E3B 0%, #065F46 100%);
  color: #6EE7B7;
}

/* 事件骨架屏 */
.events-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-skeleton-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 14px;
}

:global(.dark-mode) .event-skeleton-item {
  background: rgba(30, 30, 56, 0.4);
}

.skeleton-days-badge {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

:global(.dark-mode) .skeleton-days-badge {
  background: linear-gradient(90deg, #2a2a4a 25%, #353560 50%, #2a2a4a 75%);
  background-size: 200% 100%;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

:global(.dark-mode) .skeleton-line {
  background: linear-gradient(90deg, #2a2a4a 25%, #353560 50%, #2a2a4a 75%);
  background-size: 200% 100%;
}

.skeleton-line-short {
  width: 40%;
}

.skeleton-line-long {
  width: 70%;
}

/* 空状态 */
.events-empty,
.activities-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  text-align: center;
}

.empty-emoji {
  font-size: 40px;
  animation: gentle-bounce 3s ease-in-out infinite;
}

.empty-text {
  font-size: 14px;
  color: #9CA3AF;
  font-weight: 500;
}

:global(.dark-mode) .empty-text {
  color: #8888A0;
}

.empty-stars {
  font-size: 16px;
  animation: twinkle 2s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

@keyframes item-slide-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 活动列表 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 10px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  animation: item-slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.activity-item:hover {
  background: rgba(255, 155, 168, 0.06);
}

:global(.dark-mode) .activity-item:hover {
  background: rgba(192, 132, 252, 0.06);
}

.activity-dot {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.activity-item:hover .activity-dot {
  transform: scale(1.08);
}

.activity-icon {
  font-size: 16px;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}

.activity-pet-name {
  font-weight: 700;
  font-size: 14px;
  color: #2D2D2D;
}

:global(.dark-mode) .activity-pet-name {
  color: #E8E8E8;
}

.activity-date {
  font-size: 12px;
  color: #9CA3AF;
  flex-shrink: 0;
}

:global(.dark-mode) .activity-date {
  color: #8888A0;
}

.activity-title {
  font-size: 13px;
  color: #6B6B6B;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark-mode) .activity-title {
  color: #B8B8CC;
}

/* 喂养统计 */
.feeding-stats-section {
  margin-bottom: 20px;
}

.section-subtitle {
  font-size: 12px;
  color: #9CA3AF;
  margin-left: 4px;
}

:global(.dark-mode) .section-subtitle {
  color: #8888A0;
}

.feeding-stats-card {
  border-radius: 20px;
}

.feeding-stats-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feeding-stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feeding-stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.feeding-stat-name {
  font-weight: 700;
  font-size: 14px;
  color: #2D2D2D;
}

:global(.dark-mode) .feeding-stat-name {
  color: #E8E8E8;
}

.feeding-stat-count {
  font-size: 13px;
  color: #6B6B6B;
  font-weight: 600;
}

:global(.dark-mode) .feeding-stat-count {
  color: #B8B8CC;
}

.feeding-stat-avg {
  font-weight: 400;
  color: #9CA3AF;
  font-size: 12px;
}

:global(.dark-mode) .feeding-stat-avg {
  color: #8888A0;
}

.feeding-stat-bar-bg {
  height: 10px;
  background: #F0E6E0;
  border-radius: 5px;
  overflow: hidden;
}

:global(.dark-mode) .feeding-stat-bar-bg {
  background: #3D3D5C;
}

.feeding-stat-bar {
  height: 100%;
  border-radius: 5px;
  background: linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%);
  transition: width 0.6s ease;
  min-width: 8px;
}

:global(.dark-mode) .feeding-stat-bar {
  background: linear-gradient(90deg, #D97706 0%, #B45309 100%);
}

/* 快捷操作 - 毛玻璃版 */
.quick-actions-section {
  margin-bottom: 20px;
}

.quick-actions-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.quick-action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 22px 12px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, border-color 0.3s ease;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: qa-card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--qa-delay, 0s);
}

@keyframes qa-card-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.quick-action-card:hover {
  transform: translateY(-5px) scale(1.04);
  box-shadow: 0 12px 36px rgba(255, 155, 168, 0.18);
  border-color: rgba(255, 200, 215, 0.6);
  background: rgba(255, 255, 255, 0.65);
}

:global(.dark-mode) .quick-action-card {
  background: rgba(35, 35, 65, 0.55);
  border-color: rgba(80, 80, 120, 0.35);
}

:global(.dark-mode) .quick-action-card:hover {
  background: rgba(45, 45, 80, 0.65);
  border-color: rgba(120, 100, 180, 0.45);
  box-shadow: 0 12px 36px rgba(120, 100, 200, 0.15);
}

.quick-action-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
  filter: grayscale(0.3);
}

.quick-action-icon {
  font-size: 28px;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
}

.quick-action-card:hover .quick-action-icon {
  transform: scale(1.12);
  animation: qa-icon-pop 0.45s ease;
}

@keyframes qa-icon-pop {
  0%, 100% { transform: scale(1.12); }
  50% { transform: scale(1.25); }
}

.add-pet-icon {
  background: linear-gradient(135deg, rgba(255, 245, 247, 0.8), rgba(255, 228, 233, 0.8));
  box-shadow: 0 4px 16px rgba(255, 155, 168, 0.15);
}

.add-weight-icon {
  background: linear-gradient(135deg, rgba(224, 242, 254, 0.8), rgba(186, 230, 253, 0.8));
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.15);
}

.add-health-icon {
  background: linear-gradient(135deg, rgba(252, 231, 243, 0.8), rgba(251, 207, 232, 0.8));
  box-shadow: 0 4px 16px rgba(244, 114, 182, 0.15);
}

.add-feeding-icon {
  background: linear-gradient(135deg, rgba(254, 249, 195, 0.8), rgba(254, 240, 138, 0.8));
  box-shadow: 0 4px 16px rgba(250, 204, 21, 0.15);
}

.album-icon {
  background: linear-gradient(135deg, rgba(237, 233, 254, 0.8), rgba(221, 214, 254, 0.8));
  box-shadow: 0 4px 16px rgba(167, 139, 250, 0.15);
}

.timeline-icon {
  background: linear-gradient(135deg, rgba(209, 250, 229, 0.8), rgba(167, 243, 208, 0.8));
  box-shadow: 0 4px 16px rgba(52, 211, 153, 0.15);
}

.medication-icon {
  background: linear-gradient(135deg, rgba(245, 240, 255, 0.8), rgba(237, 233, 254, 0.8));
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15);
}

:global(.dark-mode) .add-pet-icon {
  background: linear-gradient(135deg, rgba(61, 32, 37, 0.8), rgba(77, 32, 48, 0.8));
  box-shadow: 0 4px 16px rgba(255, 100, 120, 0.1);
}

:global(.dark-mode) .add-weight-icon {
  background: linear-gradient(135deg, rgba(30, 42, 58, 0.8), rgba(30, 58, 74, 0.8));
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.1);
}

:global(.dark-mode) .add-health-icon {
  background: linear-gradient(135deg, rgba(58, 29, 46, 0.8), rgba(74, 29, 62, 0.8));
  box-shadow: 0 4px 16px rgba(244, 114, 182, 0.1);
}

:global(.dark-mode) .add-feeding-icon {
  background: linear-gradient(135deg, rgba(58, 53, 32, 0.8), rgba(74, 64, 32, 0.8));
  box-shadow: 0 4px 16px rgba(250, 204, 21, 0.1);
}

:global(.dark-mode) .album-icon {
  background: linear-gradient(135deg, rgba(45, 32, 64, 0.8), rgba(61, 32, 80, 0.8));
  box-shadow: 0 4px 16px rgba(167, 139, 250, 0.1);
}

:global(.dark-mode) .timeline-icon {
  background: linear-gradient(135deg, rgba(26, 58, 42, 0.8), rgba(42, 74, 58, 0.8));
  box-shadow: 0 4px 16px rgba(52, 211, 153, 0.1);
}

:global(.dark-mode) .medication-icon {
  background: linear-gradient(135deg, rgba(45, 32, 64, 0.8), rgba(61, 32, 80, 0.8));
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.quick-action-label {
  font-size: 13px;
  font-weight: 600;
  color: #4A4A4A;
  letter-spacing: 0.3px;
}

:global(.dark-mode) .quick-action-label {
  color: #E8E8E8;
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 22px;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 28px;
  }

  .event-item {
    gap: 10px;
    padding: 10px 12px;
  }

  .pet-overviews-row {
    grid-template-columns: 1fr;
  }

  .pet-overviews-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .pet-sort-bar {
    gap: 4px;
  }

  .pet-sort-pill {
    padding: 3px 10px;
    font-size: 11px;
  }

  .quick-actions-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .quick-action-card {
    padding: 16px 8px;
  }

  .quick-action-icon {
    font-size: 24px;
    width: 44px;
    height: 44px;
    border-radius: 14px;
  }

  .quick-action-label {
    font-size: 12px;
  }
}

/* ===== 仪表盘骨架屏 shimmer ===== */
.dash-skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dash-skel-pill {
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: dash-shimmer 1.5s ease-in-out infinite;
}

:global(.dark-mode) .dash-skel-pill {
  background: linear-gradient(90deg, #2a2a3e 25%, #35354d 50%, #2a2a3e 75%);
  background-size: 200% 100%;
}

/* Hero 统计条骨架 */
.hero-stats-strip .dash-skeleton-pill {
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 75%);
  background-size: 200% 100%;
  animation: dash-shimmer 1.5s ease-in-out infinite;
  display: block;
}

/* 统计卡片骨架 */
.dash-skel-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.dash-skel-stat-card {
  border-radius: 18px;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: dash-card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both, dash-shimmer 1.5s ease-in-out infinite;
}

:global(.dark-mode) .dash-skel-stat-card {
  background: rgba(40, 40, 60, 0.5);
  border-color: rgba(255, 255, 255, 0.06);
}

.dash-skel-stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: dash-shimmer 1.5s ease-in-out infinite;
}

:global(.dark-mode) .dash-skel-stat-icon {
  background: linear-gradient(90deg, #2a2a3e 25%, #35354d 50%, #2a2a3e 75%);
  background-size: 200% 100%;
}

/* Section 骨架 */
.dash-skel-section {
  border-radius: 18px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: dash-card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

:global(.dark-mode) .dash-skel-section {
  background: rgba(40, 40, 60, 0.5);
  border-color: rgba(255, 255, 255, 0.06);
}

.dash-skel-section-header {
  margin-bottom: 16px;
}

/* 快捷操作骨架 */
.dash-skel-quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
}

.dash-skel-qa-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
  animation: dash-card-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

:global(.dark-mode) .dash-skel-qa-card {
  background: rgba(50, 50, 70, 0.3);
}

.dash-skel-qa-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: dash-shimmer 1.5s ease-in-out infinite;
}

:global(.dark-mode) .dash-skel-qa-icon {
  background: linear-gradient(90deg, #2a2a3e 25%, #35354d 50%, #2a2a3e 75%);
  background-size: 200% 100%;
}

/* 宠物速览骨架 */
.dash-skel-pets {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.dash-skel-pet-card {
  min-width: 200px;
  flex: 1;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(8px);
  animation: dash-card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

:global(.dark-mode) .dash-skel-pet-card {
  background: rgba(50, 50, 70, 0.3);
}

.dash-skel-pet-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dash-skel-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: dash-shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

:global(.dark-mode) .dash-skel-avatar {
  background: linear-gradient(90deg, #2a2a3e 25%, #35354d 50%, #2a2a3e 75%);
  background-size: 200% 100%;
}

.dash-skel-pet-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dash-skel-pet-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

:global(.dark-mode) .dash-skel-pet-meta {
  border-top-color: rgba(255, 255, 255, 0.04);
}

/* 事件 + 活动双栏骨架 */
.dash-skel-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.dash-skel-events {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dash-skel-event-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.02);
  animation: dash-card-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

:global(.dark-mode) .dash-skel-event-item {
  background: rgba(255, 255, 255, 0.02);
}

.dash-skel-event-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: dash-shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

:global(.dark-mode) .dash-skel-event-badge {
  background: linear-gradient(90deg, #2a2a3e 25%, #35354d 50%, #2a2a3e 75%);
  background-size: 200% 100%;
}

.dash-skel-event-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dash-skel-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: dash-shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

:global(.dark-mode) .dash-skel-dot {
  background: linear-gradient(90deg, #2a2a3e 25%, #35354d 50%, #2a2a3e 75%);
  background-size: 200% 100%;
}

/* 骨架动画 */
@keyframes dash-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes dash-card-in {
  0% { opacity: 0; transform: translateY(14px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .dash-skel-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .dash-skel-stat-card {
    padding: 14px 10px;
    border-radius: 14px;
  }

  .dash-skel-quick-actions {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .dash-skel-pets {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .dash-skel-pet-card {
    min-width: 170px;
  }

  .dash-skel-two-col {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .dash-skel-section {
    padding: 16px;
    border-radius: 14px;
  }
}

@media (max-width: 480px) {
  .dash-skel-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .dash-skel-stat-card {
    padding: 12px 8px;
  }

  .dash-skel-stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .dash-skel-quick-actions {
    grid-template-columns: repeat(3, 1fr);
  }

  .dash-skeleton-wrap {
    gap: 18px;
  }
}
</style>
