<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePetStore } from '@/stores/petStore.js'
import { useAuthStore } from '@/stores/authStore.js'
import { getEventTypeIcon } from '@/utils/eventTypeIcon.js'

const petStore = usePetStore()
const authStore = useAuthStore()
const isOpen = ref(false)
const bellRef = ref(null)
const panelRef = ref(null)
const isRefreshing = ref(false)
let refreshTimer = null
const REFRESH_INTERVAL = 5 * 60 * 1000

const notifications = computed(() => {
  if (!authStore.isAuthenticated) return []
  return petStore.upcomingEvents || []
})

const overdueNotifications = computed(() =>
  notifications.value.filter(e => e.isOverdue)
)

const todayNotifications = computed(() =>
  notifications.value.filter(e => !e.isOverdue && e.daysLeft === 0)
)

const urgentNotifications = computed(() =>
  notifications.value.filter(e => e.daysLeft > 0 && e.daysLeft <= 3)
)

const soonNotifications = computed(() =>
  notifications.value.filter(e => e.daysLeft > 3 && e.daysLeft <= 7)
)

const totalCount = computed(() => overdueNotifications.value.length + todayNotifications.value.length)
const hasNotifications = computed(() => notifications.value.length > 0)

async function refreshNotifications() {
  if (!authStore.isAuthenticated || isRefreshing.value) return
  isRefreshing.value = true
  try {
    await petStore.loadUpcomingEvents()
  } finally {
    isRefreshing.value = false
  }
}

function togglePanel() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    refreshNotifications()
  }
}

function closePanel(e) {
  if (isOpen.value && bellRef.value && !bellRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

function handleNotificationClick() {
  isOpen.value = false
  petStore.activePage = 'health-events'
}

function goToHealthEvents() {
  isOpen.value = false
  petStore.activePage = 'health-events'
}

function getEventIcon(event) {
  return getEventTypeIcon(event.eventTypeLabel || '')
}

function getNotifLabel(event) {
  if (event.isOverdue) return `已过期 ${Math.abs(event.daysLeft)} 天`
  if (event.daysLeft === 0) return '今日到期'
  if (event.daysLeft === 1) return '明天到期'
  return `${event.daysLeft} 天后到期`
}

function getNotifBg(event) {
  if (event.isOverdue) return 'rgba(239, 68, 68, 0.08)'
  if (event.daysLeft === 0) return 'rgba(245, 158, 11, 0.08)'
  if (event.daysLeft <= 3) return 'rgba(249, 115, 22, 0.08)'
  return 'rgba(59, 130, 246, 0.08)'
}

watch(() => authStore.isAuthenticated, (auth) => {
  if (auth) {
    refreshNotifications()
    if (!refreshTimer) {
      refreshTimer = setInterval(refreshNotifications, REFRESH_INTERVAL)
    }
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
})

onMounted(() => {
  document.addEventListener('click', closePanel)
  if (authStore.isAuthenticated) {
    petStore.loadUpcomingEvents()
    refreshTimer = setInterval(refreshNotifications, REFRESH_INTERVAL)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closePanel)
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<template>
  <div v-if="authStore.isAuthenticated" ref="bellRef" class="notif-bell-container">
    <button
      class="notif-bell-btn"
      :class="{ 'has-notif': hasNotifications, 'is-open': isOpen }"
      @click.stop="togglePanel"
    >
      <span class="notif-bell-icon">🔔</span>
      <transition name="badge-pop">
        <span v-if="totalCount > 0" class="notif-badge">
          {{ totalCount > 9 ? '9+' : totalCount }}
        </span>
      </transition>
    </button>

    <transition name="panel-slide">
      <div v-if="isOpen" ref="panelRef" class="notif-panel">
        <div class="notif-panel-header">
          <span class="notif-panel-title">🔔 通知中心</span>
          <div class="notif-header-right">
            <span v-if="isRefreshing" class="notif-refresh-dot"></span>
            <span v-if="notifications.length > 0" class="notif-panel-count">
              {{ notifications.length }} 条提醒
            </span>
          </div>
        </div>

        <div class="notif-panel-body">
          <!-- 无通知 -->
          <div v-if="notifications.length === 0" class="notif-empty">
            <span class="notif-empty-icon">✨</span>
            <span class="notif-empty-text">暂无待处理提醒</span>
            <span class="notif-empty-sub">所有宠物都很健康！</span>
          </div>

          <!-- 已过期 -->
          <div v-if="overdueNotifications.length > 0" class="notif-group">
            <div class="notif-group-label notif-group-overdue">
              <span>⚠️</span> 已过期 ({{ overdueNotifications.length }})
            </div>
            <div
              v-for="event in overdueNotifications"
              :key="'o-' + event.id"
              class="notif-item"
              :style="{ borderLeftColor: '#EF4444', background: getNotifBg(event) }"
              @click="handleNotificationClick()"
            >
              <span class="notif-item-icon">{{ getEventIcon(event) }}</span>
              <div class="notif-item-content">
                <span class="notif-item-pet">{{ event.petName }}</span>
                <span class="notif-item-event">{{ event.eventTypeLabel }}</span>
              </div>
              <span class="notif-item-badge" style="background: #EF4444; color: #fff;">
                {{ getNotifLabel(event) }}
              </span>
            </div>
          </div>

          <!-- 今日到期 -->
          <div v-if="todayNotifications.length > 0" class="notif-group">
            <div class="notif-group-label notif-group-today">
              <span>⏰</span> 今日到期 ({{ todayNotifications.length }})
            </div>
            <div
              v-for="event in todayNotifications"
              :key="'t-' + event.id"
              class="notif-item"
              :style="{ borderLeftColor: '#F59E0B', background: getNotifBg(event) }"
              @click="handleNotificationClick()"
            >
              <span class="notif-item-icon">{{ getEventIcon(event) }}</span>
              <div class="notif-item-content">
                <span class="notif-item-pet">{{ event.petName }}</span>
                <span class="notif-item-event">{{ event.eventTypeLabel }}</span>
              </div>
              <span class="notif-item-badge" style="background: #F59E0B; color: #fff;">
                {{ getNotifLabel(event) }}
              </span>
            </div>
          </div>

          <!-- 即将到期 1-3天 -->
          <div v-if="urgentNotifications.length > 0" class="notif-group">
            <div class="notif-group-label notif-group-urgent">
              <span>📅</span> 即将到期 ({{ urgentNotifications.length }})
            </div>
            <div
              v-for="event in urgentNotifications"
              :key="'u-' + event.id"
              class="notif-item"
              :style="{ borderLeftColor: '#F97316', background: getNotifBg(event) }"
              @click="handleNotificationClick()"
            >
              <span class="notif-item-icon">{{ getEventIcon(event) }}</span>
              <div class="notif-item-content">
                <span class="notif-item-pet">{{ event.petName }}</span>
                <span class="notif-item-event">{{ event.eventTypeLabel }}</span>
              </div>
              <span class="notif-item-badge" style="background: #F97316; color: #fff;">
                {{ getNotifLabel(event) }}
              </span>
            </div>
          </div>

          <!-- 近期 4-7天 -->
          <div v-if="soonNotifications.length > 0" class="notif-group">
            <div class="notif-group-label notif-group-soon">
              <span>📋</span> 近期提醒 ({{ soonNotifications.length }})
            </div>
            <div
              v-for="event in soonNotifications"
              :key="'s-' + event.id"
              class="notif-item"
              :style="{ borderLeftColor: '#3B82F6', background: getNotifBg(event) }"
              @click="handleNotificationClick()"
            >
              <span class="notif-item-icon">{{ getEventIcon(event) }}</span>
              <div class="notif-item-content">
                <span class="notif-item-pet">{{ event.petName }}</span>
                <span class="notif-item-event">{{ event.eventTypeLabel }}</span>
              </div>
              <span class="notif-item-badge" style="background: #3B82F6; color: #fff;">
                {{ getNotifLabel(event) }}
              </span>
            </div>
          </div>
        </div>

        <div class="notif-panel-footer" @click="goToHealthEvents">
          <span>查看全部健康事件</span>
          <span class="notif-footer-arrow">→</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.notif-bell-container {
  position: relative;
}

.notif-bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(255, 155, 168, 0.12);
  border-radius: 12px;
  background: rgba(255, 245, 247, 0.5);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.notif-bell-btn:hover {
  background: rgba(255, 155, 168, 0.15);
  border-color: rgba(255, 155, 168, 0.3);
  transform: translateY(-1px);
}

.notif-bell-btn.is-open {
  background: rgba(255, 155, 168, 0.2);
  border-color: rgba(255, 155, 168, 0.35);
}

.dark-mode .notif-bell-btn {
  background: rgba(61, 61, 92, 0.5);
  border-color: rgba(255, 155, 168, 0.08);
}

.dark-mode .notif-bell-btn:hover,
.dark-mode .notif-bell-btn.is-open {
  background: rgba(255, 155, 168, 0.12);
  border-color: rgba(255, 155, 168, 0.2);
}

.notif-bell-icon {
  font-size: 18px;
  line-height: 1;
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.notif-bell-btn.has-notif .notif-bell-icon {
  animation: bell-shake 3s ease-in-out infinite;
}

@keyframes bell-shake {
  0%, 90%, 100% { transform: rotate(0); }
  92% { transform: rotate(12deg); }
  94% { transform: rotate(-10deg); }
  96% { transform: rotate(8deg); }
  98% { transform: rotate(-5deg); }
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 10px;
  background: linear-gradient(135deg, #EF4444, #F97316);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 2px 16px rgba(239, 68, 68, 0.6); }
}

.badge-pop-enter-active {
  animation: badge-pop-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.badge-pop-leave-active {
  animation: badge-pop-out 0.2s ease-in;
}

@keyframes badge-pop-in {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes badge-pop-out {
  to { transform: scale(0); opacity: 0; }
}

/* --- Panel --- */
.notif-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 380px;
  max-height: 520px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px) saturate(1.6);
  -webkit-backdrop-filter: blur(24px) saturate(1.6);
  border: 1px solid rgba(255, 155, 168, 0.15);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(255, 155, 168, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  z-index: 1200;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dark-mode .notif-panel {
  background: rgba(35, 35, 56, 0.92);
  border-color: rgba(255, 155, 168, 0.1);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 8px 24px rgba(255, 155, 168, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.panel-slide-enter-active {
  animation: panel-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.panel-slide-leave-active {
  animation: panel-out 0.18s ease-in;
}

@keyframes panel-in {
  0% { opacity: 0; transform: translateY(-8px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes panel-out {
  to { opacity: 0; transform: translateY(-8px) scale(0.96); }
}

/* --- Header --- */
.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(255, 155, 168, 0.1);
}

.dark-mode .notif-panel-header {
  border-bottom-color: rgba(255, 155, 168, 0.06);
}

.notif-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #2D2D2D;
}

.dark-mode .notif-panel-title {
  color: #F0F0F0;
}

.notif-panel-count {
  font-size: 12px;
  color: #9CA3AF;
  padding: 2px 10px;
  border-radius: 10px;
  background: rgba(255, 155, 168, 0.08);
}

.dark-mode .notif-panel-count {
  background: rgba(255, 155, 168, 0.06);
  color: #888;
}

.notif-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-refresh-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF7A8A, #FF9DB5);
  animation: refresh-spin 1s linear infinite;
}

@keyframes refresh-spin {
  from { transform: rotate(0deg); opacity: 1; }
  50% { opacity: 0.4; }
  to { transform: rotate(360deg); opacity: 1; }
}

/* --- Body --- */
.notif-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  max-height: 400px;
}

.notif-panel-body::-webkit-scrollbar {
  width: 4px;
}

.notif-panel-body::-webkit-scrollbar-thumb {
  background: rgba(255, 155, 168, 0.2);
  border-radius: 4px;
}

/* --- Groups --- */
.notif-group {
  padding: 0 8px;
}

.notif-group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.notif-group-overdue { color: #EF4444; }
.notif-group-today { color: #F59E0B; }
.notif-group-urgent { color: #F97316; }
.notif-group-soon { color: #3B82F6; }

.dark-mode .notif-group-overdue { color: #FCA5A5; }
.dark-mode .notif-group-today { color: #FCD34D; }
.dark-mode .notif-group-urgent { color: #FDBA74; }
.dark-mode .notif-group-soon { color: #93C5FD; }

/* --- Items --- */
.notif-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 3px 0;
  border-radius: 12px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  animation: notif-item-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.notif-item:nth-child(2) { animation-delay: 0.03s; }
.notif-item:nth-child(3) { animation-delay: 0.06s; }
.notif-item:nth-child(4) { animation-delay: 0.09s; }
.notif-item:nth-child(5) { animation-delay: 0.12s; }

@keyframes notif-item-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.notif-item:hover {
  transform: translateX(3px);
  background: rgba(255, 155, 168, 0.1) !important;
}

.dark-mode .notif-item:hover {
  background: rgba(255, 155, 168, 0.08) !important;
}

.notif-item-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
}

.dark-mode .notif-item-icon {
  background: rgba(255, 255, 255, 0.05);
}

.notif-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.notif-item-pet {
  font-size: 13px;
  font-weight: 600;
  color: #2D2D2D;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark-mode .notif-item-pet {
  color: #E8E8E8;
}

.notif-item-event {
  font-size: 12px;
  color: #6B6B6B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark-mode .notif-item-event {
  color: #999;
}

.notif-item-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

/* --- Empty --- */
.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 20px;
}

.notif-empty-icon {
  font-size: 36px;
  animation: empty-bounce 2s ease-in-out infinite;
}

@keyframes empty-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.notif-empty-text {
  font-size: 14px;
  font-weight: 600;
  color: #4A4A4A;
}

.dark-mode .notif-empty-text {
  color: #D4D4D4;
}

.notif-empty-sub {
  font-size: 12px;
  color: #9CA3AF;
}

/* --- Footer --- */
.notif-panel-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 20px;
  border-top: 1px solid rgba(255, 155, 168, 0.1);
  font-size: 13px;
  font-weight: 600;
  color: #FF7A8A;
  cursor: pointer;
  transition: all 0.25s ease;
}

.notif-panel-footer:hover {
  background: rgba(255, 155, 168, 0.08);
}

.notif-footer-arrow {
  transition: transform 0.25s ease;
}

.notif-panel-footer:hover .notif-footer-arrow {
  transform: translateX(3px);
}

.dark-mode .notif-panel-footer {
  border-top-color: rgba(255, 155, 168, 0.06);
  color: #FFBFC5;
}

.dark-mode .notif-panel-footer:hover {
  background: rgba(255, 155, 168, 0.06);
}

/* --- Mobile --- */
@media (max-width: 768px) {
  .notif-panel {
    position: fixed;
    top: 72px;
    right: 8px;
    left: 8px;
    width: auto;
    max-height: 70vh;
  }

  .notif-bell-btn {
    width: 34px;
    height: 34px;
  }
}

@media (max-width: 480px) {
  .notif-panel {
    right: 4px;
    left: 4px;
    border-radius: 16px;
  }
}
</style>
