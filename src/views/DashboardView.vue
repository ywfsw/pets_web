<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { fetchDashboardSummary } from '@/api.js';
import { getEventTypeIcon } from '@/utils/eventTypeIcon.js';
import {
  NCard,
  NSpace,
  NIcon,
  NTag,
  NSpin,
  NEmpty,
  NButton,
  NPopconfirm
} from 'naive-ui';
import {
  CalendarOutline,
  AlertCircleOutline,
  CheckmarkCircleOutline,
  TimeOutline
} from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();

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

:global(.dark-mode) .stat-pets {
  background: linear-gradient(135deg, #3D2025 0%, #4D2030 100%);
}

:global(.dark-mode) .stat-events {
  background: linear-gradient(135deg, #3D3520 0%, #4D4020 100%);
}

:global(.dark-mode) .stat-photos {
  background: linear-gradient(135deg, #2D2040 0%, #3D2050 100%);
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

/* 响应式 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 22px;
  }

  .stats-row {
    grid-template-columns: 1fr;
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
}
</style>
