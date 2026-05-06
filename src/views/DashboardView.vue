<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import { fetchDashboardSummary } from '@/api.js';
import { getEventTypeIcon } from '@/utils/eventTypeIcon.js';
import PetLeaderboard from '@/components/PetLeaderboard.vue';
import {
  NCard,
  NSpace,
  NIcon,
  NTag,
  NSpin,
  NEmpty,
  NButton,
  NPopconfirm,
  NAvatar,
  useMessage
} from 'naive-ui';
import {
  CalendarOutline,
  AlertCircleOutline,
  CheckmarkCircleOutline,
  TimeOutline
} from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();
const message = useMessage();
const { getAvatarUrl } = useCloudinaryImage();

const dashboardData = ref(null);
const loading = ref(true);
const error = ref(false);

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
  const map = { weight: '#7DD3FC', health: '#FCA5A5', feeding: '#FBBF24', photo: '#C084FC' };
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
    <n-spin :show="loading">
      <!-- 欢迎区域 -->
      <div class="dashboard-hero">
        <div class="hero-content">
          <h1 class="hero-title">{{ greeting }}{{ authStore.userInfo?.username ? '，' + authStore.userInfo.username : '' }} 🐾</h1>
          <p class="hero-subtitle">欢迎回到萌宠之家</p>
        </div>
      </div>

      <template v-if="!loading && dashboardData">
        <!-- 统计卡片 -->
        <div class="stats-row">
          <n-card class="stat-card stat-pets" :bordered="false">
            <div class="stat-icon">🐾</div>
            <div class="stat-value">{{ dashboardData.totalPets }}</div>
            <div class="stat-label">我的萌宠</div>
          </n-card>
          <n-card class="stat-card stat-events" :bordered="false">
            <div class="stat-icon">📋</div>
            <div class="stat-value">{{ dashboardData.pendingEvents }}</div>
            <div class="stat-label">待处理事件</div>
          </n-card>
          <n-card class="stat-card stat-photos" :bordered="false">
            <div class="stat-icon">📷</div>
            <div class="stat-value">{{ dashboardData.totalPhotos }}</div>
            <div class="stat-label">相册照片</div>
          </n-card>
          <n-card class="stat-card stat-weight" :bordered="false">
            <div class="stat-icon">⚖️</div>
            <div class="stat-value">{{ dashboardData.totalWeightRecords }}</div>
            <div class="stat-label">体重记录</div>
          </n-card>
          <n-card class="stat-card stat-health" :bordered="false">
            <div class="stat-icon">🩺</div>
            <div class="stat-value">{{ dashboardData.totalHealthEvents }}</div>
            <div class="stat-label">健康事件</div>
          </n-card>
          <n-card class="stat-card stat-feeding" :bordered="false">
            <div class="stat-icon">🍽️</div>
            <div class="stat-value">{{ dashboardData.totalFeedings }}</div>
            <div class="stat-label">喂养记录</div>
          </n-card>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions-section">
          <div class="section-header">
            <span class="section-emoji">⚡</span>
            <span class="section-title">快捷操作</span>
          </div>
          <div class="quick-actions-row">
            <div class="quick-action-card" @click="handleQuickAction('addPet')">
              <div class="quick-action-icon add-pet-icon">🐾</div>
              <span class="quick-action-label">添加宠物</span>
            </div>
            <div
              class="quick-action-card"
              :class="{ 'quick-action-disabled': !dashboardData.petOverviews?.length }"
              @click="handleQuickAction('addWeight')"
            >
              <div class="quick-action-icon add-weight-icon">⚖️</div>
              <span class="quick-action-label">记录体重</span>
            </div>
            <div
              class="quick-action-card"
              :class="{ 'quick-action-disabled': !dashboardData.petOverviews?.length }"
              @click="handleQuickAction('addHealthEvent')"
            >
              <div class="quick-action-icon add-health-icon">🩺</div>
              <span class="quick-action-label">健康事件</span>
            </div>
            <div
              class="quick-action-card"
              :class="{ 'quick-action-disabled': !dashboardData.petOverviews?.length }"
              @click="handleQuickAction('addFeeding')"
            >
              <div class="quick-action-icon add-feeding-icon">🍽️</div>
              <span class="quick-action-label">记录喂养</span>
            </div>
            <div class="quick-action-card" @click="handleQuickAction('album')">
              <div class="quick-action-icon album-icon">📷</div>
              <span class="quick-action-label">宠物相册</span>
            </div>
            <div class="quick-action-card" @click="handleQuickAction('timeline')">
              <div class="quick-action-icon timeline-icon">📈</div>
              <span class="quick-action-label">成长时间线</span>
            </div>
          </div>
        </div>

        <!-- 萌宠点赞榜 -->
        <PetLeaderboard v-if="dashboardData.totalPets > 0" />

        <!-- 宠物速览 -->
        <div v-if="dashboardData.petOverviews?.length" class="pet-overviews-section">
          <div class="section-header">
            <span class="section-emoji">🐾</span>
            <span class="section-title">我的宠物</span>
          </div>
          <div class="pet-overviews-row">
            <div
              v-for="pet in dashboardData.petOverviews"
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
        <div v-if="dashboardData.feedingStats?.length" class="feeding-stats-section">
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
        <n-card class="section-card" :bordered="false">
          <template #header>
            <n-space align="center">
              <n-icon :component="CalendarOutline" size="20" color="#FF9BA8" />
              <span class="section-title">📅 即将到期的事件</span>
              <n-tag v-if="petStore.upcomingEvents.length" size="small" round type="warning">
                {{ petStore.upcomingEvents.length }}
              </n-tag>
            </n-space>
          </template>
          <n-spin :show="petStore.loadingUpcoming">
            <div v-if="petStore.upcomingEvents.length" class="event-list">
              <div
                v-for="event in petStore.upcomingEvents.slice(0, 5)"
                :key="event.id"
                class="event-item"
                :class="{ 'event-overdue': event.isOverdue }"
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
                    <n-tag :type="getDaysTagType(event.daysLeft)" size="small" round>
                      {{ event.eventTypeLabel }}
                    </n-tag>
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
                    <n-button
                      text
                      type="success"
                      size="tiny"
                      class="event-complete-btn"
                      :disabled="!authStore.isAuthenticated"
                      @click.stop
                    >
                      <template #icon>
                        <n-icon :component="CheckmarkCircleOutline" :size="18" />
                      </template>
                    </n-button>
                  </template>
                  标记此事件为已完成？
                </n-popconfirm>
                <span class="event-arrow">›</span>
              </div>
            </div>
            <n-empty v-else-if="!petStore.loadingUpcoming" description="太棒了！没有需要提醒的事件～" size="small">
              <template #icon>
                <span style="font-size: 40px;">🎉</span>
              </template>
            </n-empty>
          </n-spin>
        </n-card>

        <!-- 最近活动 -->
        <n-card class="section-card" :bordered="false">
          <template #header>
            <n-space align="center">
              <n-icon :component="TimeOutline" size="20" color="#C084FC" />
              <span class="section-title">🕐 最近活动</span>
            </n-space>
          </template>
          <div v-if="dashboardData.recentActivities?.length" class="activity-list">
            <div
              v-for="item in dashboardData.recentActivities"
              :key="item.id"
              class="activity-item"
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
          <n-empty v-else description="暂无最近活动，快去记录萌宠的生活吧！" size="small">
            <template #icon>
              <span style="font-size: 40px;">📝</span>
            </template>
          </n-empty>
        </n-card>
      </template>

      <!-- 加载失败 -->
      <n-card v-if="!loading && error" class="section-card" :bordered="false">
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
    </n-spin>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 0 auto;
}

/* 欢迎区域 */
.dashboard-hero {
  text-align: center;
  padding: 32px 0 24px;
}

.hero-title {
  font-size: 28px;
  font-weight: 800;
  color: #2D2D2D;
  margin: 0 0 8px;
  background: linear-gradient(135deg, #FF9BA8 0%, #C084FC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 15px;
  color: #9CA3AF;
  margin: 0;
}

:global(.dark-mode) .hero-title {
  background: linear-gradient(135deg, #FFB4C2 0%, #D8B4FE 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:global(.dark-mode) .hero-subtitle {
  color: #8888A0;
}

/* 统计卡片 */
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
  padding: 24px 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-pets {
  background: linear-gradient(135deg, #FFF5F7 0%, #FFE4E9 100%);
}

.stat-events {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
}

.stat-photos {
  background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
}

.stat-weight {
  background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
}

.stat-health {
  background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
}

.stat-feeding {
  background: linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%);
}

:global(.dark-mode) .stat-pets {
  background: linear-gradient(135deg, #3D2025 0%, #4D2030 100%);
}

:global(.dark-mode) .stat-events {
  background: linear-gradient(135deg, #3D3520 0%, #4D4020 100%);
}

:global(.dark-mode) .stat-photos {
  background: linear-gradient(135deg, #2D2040 0%, #3D2050 100%);
}

:global(.dark-mode) .stat-weight {
  background: linear-gradient(135deg, #1E2A3A 0%, #1E3A4A 100%);
}

:global(.dark-mode) .stat-health {
  background: linear-gradient(135deg, #3A1D2E 0%, #4A1D3E 100%);
}

:global(.dark-mode) .stat-feeding {
  background: linear-gradient(135deg, #3A3520 0%, #4A4020 100%);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: #2D2D2D;
  line-height: 1;
  margin-bottom: 4px;
}

:global(.dark-mode) .stat-value {
  color: #E8E8E8;
}

.stat-label {
  font-size: 14px;
  color: #6B6B6B;
  font-weight: 500;
}

:global(.dark-mode) .stat-label {
  color: #B8B8CC;
}

/* 宠物速览 */
.pet-overviews-section {
  margin-bottom: 20px;
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
  background: white;
  border-radius: 16px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #F0E6E0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.pet-overview-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.18);
  border-color: #FFD5DD;
}

:global(.dark-mode) .pet-overview-card {
  background: #1F1F3A;
  border-color: #3D3D5C;
}

:global(.dark-mode) .pet-overview-card:hover {
  border-color: #5D5D7C;
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

/* 区块卡片 */
.section-card {
  border-radius: 20px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #2D2D2D;
}

:global(.dark-mode) .section-title {
  color: #E8E8E8;
}

/* 事件列表 */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: white;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.event-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(255, 155, 168, 0.15);
  border-color: #FFE4E9;
}

:global(.dark-mode) .event-item {
  background: #1F1F3A;
}

:global(.dark-mode) .event-item:hover {
  border-color: #3D3D5C;
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
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.15);
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

.event-arrow {
  font-size: 20px;
  color: #D1D5DB;
  font-weight: 300;
  transition: transform 0.3s ease;
}

.event-item:hover .event-arrow {
  transform: translateX(4px);
  color: #FF9BA8;
}

:global(.dark-mode) .event-arrow {
  color: #555;
}

.event-complete-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.event-item:hover .event-complete-btn {
  opacity: 1;
}

:global(.dark-mode) .event-complete-btn {
  color: #86EFAC !important;
}

/* 活动列表 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px dashed #F0E6E0;
}

.activity-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

:global(.dark-mode) .activity-item {
  border-color: #3D3D5C;
}

.activity-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.activity-icon {
  font-size: 14px;
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
  margin-bottom: 2px;
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

/* 快捷操作 */
.quick-actions-section {
  margin-bottom: 20px;
}

.quick-actions-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.quick-action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  background: white;
  border-radius: 16px;
  border: 1px solid #F0E6E0;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.quick-action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.18);
  border-color: #FFD5DD;
}

:global(.dark-mode) .quick-action-card {
  background: #1F1F3A;
  border-color: #3D3D5C;
}

:global(.dark-mode) .quick-action-card:hover {
  border-color: #5D5D7C;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.quick-action-disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.quick-action-icon {
  font-size: 28px;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.quick-action-card:hover .quick-action-icon {
  transform: scale(1.1);
}

.add-pet-icon {
  background: linear-gradient(135deg, #FFF5F7 0%, #FFE4E9 100%);
}

.add-weight-icon {
  background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
}

.add-health-icon {
  background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
}

.add-feeding-icon {
  background: linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%);
}

.album-icon {
  background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
}

.timeline-icon {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
}

:global(.dark-mode) .add-pet-icon {
  background: linear-gradient(135deg, #3D2025 0%, #4D2030 100%);
}

:global(.dark-mode) .add-weight-icon {
  background: linear-gradient(135deg, #1E2A3A 0%, #1E3A4A 100%);
}

:global(.dark-mode) .add-health-icon {
  background: linear-gradient(135deg, #3A1D2E 0%, #4A1D3E 100%);
}

:global(.dark-mode) .add-feeding-icon {
  background: linear-gradient(135deg, #3A3520 0%, #4A4020 100%);
}

:global(.dark-mode) .album-icon {
  background: linear-gradient(135deg, #2D2040 0%, #3D2050 100%);
}

:global(.dark-mode) .timeline-icon {
  background: linear-gradient(135deg, #1A3A2A 0%, #2A4A3A 100%);
}

.quick-action-label {
  font-size: 13px;
  font-weight: 600;
  color: #4A4A4A;
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
</style>
