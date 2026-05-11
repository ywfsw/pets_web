<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePetStore } from '@/stores/petStore.js'
import { useAuthStore } from '@/stores/authStore.js'

const petStore = usePetStore()
const authStore = useAuthStore()
const isOpen = ref(false)
const bellRef = ref(null)
const panelRef = ref(null)
const isRefreshing = ref(false)
let refreshTimer = null
const REFRESH_INTERVAL = 5 * 60 * 1000

const showSettings = ref(false)
const savingPrefs = ref(false)
const localPrefs = ref({
  healthEnabled: true,
  medicationEnabled: true,
  feedingEnabled: true,
  bathingEnabled: true,
  birthdayEnabled: true,
  healthDaysBefore: 7,
  birthdayDaysBefore: 7
})

const settingTypes = [
  { key: 'healthEnabled', icon: '🩺', label: '健康事件提醒', color: '#EF4444' },
  { key: 'medicationEnabled', icon: '💊', label: '用药记录提醒', color: '#8B5CF6' },
  { key: 'feedingEnabled', icon: '🍽️', label: '喂养提醒', color: '#F59E0B' },
  { key: 'bathingEnabled', icon: '🛁', label: '美容提醒', color: '#06B6D4' },
  { key: 'birthdayEnabled', icon: '🎂', label: '生日提醒', color: '#EC4899' }
]

function openSettings() {
  if (petStore.notificationPrefs) {
    localPrefs.value = { ...petStore.notificationPrefs }
  }
  showSettings.value = true
}

function closeSettings() {
  showSettings.value = false
}

async function savePrefs() {
  savingPrefs.value = true
  try {
    await petStore.updateNotificationPrefs({ ...localPrefs.value })
    showSettings.value = false
  } finally {
    savingPrefs.value = false
  }
}

function onDaysChange(key, val) {
  const num = parseInt(val, 10)
  if (!isNaN(num) && num >= 1 && num <= 90) {
    localPrefs.value[key] = num
  }
}

const allNotifications = computed(() => petStore.notificationSummary || [])

const criticalNotifs = computed(() =>
  allNotifications.value.filter(n => n.urgency <= 1)
)

const warningNotifs = computed(() =>
  allNotifications.value.filter(n => n.urgency === 2)
)

const infoNotifs = computed(() =>
  allNotifications.value.filter(n => n.urgency >= 3)
)

const totalCount = computed(() => criticalNotifs.value.length)
const hasNotifications = computed(() => allNotifications.value.length > 0)

const typeConfig = {
  health: { color: '#EF4444', icon: '🩺', label: '健康' },
  medication: { color: '#8B5CF6', icon: '💊', label: '用药' },
  feeding: { color: '#F59E0B', icon: '🍽️', label: '喂养' },
  bathing: { color: '#06B6D4', icon: '🛁', label: '美容' },
  birthday: { color: '#EC4899', icon: '🎂', label: '生日' }
}

function getTypeConfig(type) {
  return typeConfig[type] || typeConfig.health
}

async function refreshNotifications() {
  if (!authStore.isAuthenticated || isRefreshing.value) return
  isRefreshing.value = true
  try {
    await petStore.loadNotificationSummary()
  } finally {
    isRefreshing.value = false
  }
}

function togglePanel() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    showSettings.value = false
    refreshNotifications()
    if (!petStore.notificationPrefs) {
      petStore.loadNotificationPrefs()
    }
  }
}

function closePanel(e) {
  if (isOpen.value && bellRef.value && !bellRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

function handleNotificationClick(notif) {
  isOpen.value = false
  if (notif.pageTarget) {
    petStore.activePage = notif.pageTarget
  }
}

function isBirthday(notif) {
  return notif.type === 'birthday'
}

function getUrgencyBg(notif) {
  if (isBirthday(notif)) return 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(244, 114, 182, 0.06))'
  const u = notif.urgency
  if (u === 0) return 'rgba(239, 68, 68, 0.08)'
  if (u === 1) return 'rgba(245, 158, 11, 0.08)'
  if (u === 2) return 'rgba(249, 115, 22, 0.06)'
  return 'rgba(59, 130, 246, 0.05)'
}

function getUrgencyBorder(notif) {
  if (isBirthday(notif)) return '#EC4899'
  const u = notif.urgency
  if (u === 0) return '#EF4444'
  if (u === 1) return '#F59E0B'
  if (u === 2) return '#F97316'
  return '#3B82F6'
}

function getUrgencyLabel(notif) {
  if (isBirthday(notif)) return '🎂 生日'
  const u = notif.urgency
  if (u === 0) return '紧急'
  if (u === 1) return '今日'
  if (u === 2) return '提醒'
  return '信息'
}

function getUrgencyBadgeBg(notif) {
  if (isBirthday(notif)) return 'linear-gradient(135deg, #EC4899, #F472B6)'
  const u = notif.urgency
  if (u === 0) return 'linear-gradient(135deg, #EF4444, #DC2626)'
  if (u === 1) return 'linear-gradient(135deg, #F59E0B, #D97706)'
  if (u === 2) return 'linear-gradient(135deg, #F97316, #EA580C)'
  return 'linear-gradient(135deg, #3B82F6, #2563EB)'
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
    petStore.loadNotificationSummary()
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
            <button class="notif-settings-btn" :class="{ active: showSettings }" @click.stop="showSettings ? closeSettings() : openSettings()" title="通知设置">⚙️</button>
            <span v-if="isRefreshing && !showSettings" class="notif-refresh-dot"></span>
            <span v-if="!showSettings && allNotifications.length > 0" class="notif-panel-count">
              {{ allNotifications.length }} 条提醒
            </span>
          </div>
        </div>

        <div class="notif-panel-body">
          <!-- 设置面板 -->
          <div v-if="showSettings" class="notif-settings">
            <div class="notif-settings-title">📋 通知类型开关</div>
            <div v-for="st in settingTypes" :key="st.key" class="notif-setting-row">
              <span class="notif-setting-icon" :style="{ background: st.color + '18' }">{{ st.icon }}</span>
              <span class="notif-setting-label">{{ st.label }}</span>
              <label class="notif-toggle">
                <input type="checkbox" v-model="localPrefs[st.key]" />
                <span class="notif-toggle-slider" :style="localPrefs[st.key] ? { background: st.color } : {}"></span>
              </label>
            </div>

            <div class="notif-settings-title" style="margin-top: 14px;">📅 提醒提前天数</div>
            <div class="notif-threshold-row">
              <span class="notif-threshold-icon">🩺</span>
              <span class="notif-threshold-label">健康事件提前</span>
              <input type="number" class="notif-threshold-input" min="1" max="90"
                :value="localPrefs.healthDaysBefore"
                @input="onDaysChange('healthDaysBefore', $event.target.value)" />
              <span class="notif-threshold-unit">天</span>
            </div>
            <div class="notif-threshold-row">
              <span class="notif-threshold-icon">🎂</span>
              <span class="notif-threshold-label">生日提醒提前</span>
              <input type="number" class="notif-threshold-input" min="1" max="90"
                :value="localPrefs.birthdayDaysBefore"
                @input="onDaysChange('birthdayDaysBefore', $event.target.value)" />
              <span class="notif-threshold-unit">天</span>
            </div>

            <button class="notif-settings-save" :disabled="savingPrefs" @click.stop="savePrefs">
              {{ savingPrefs ? '保存中...' : '✅ 保存设置' }}
            </button>
          </div>

          <!-- 无通知 -->
          <div v-if="!showSettings && allNotifications.length === 0 && !isRefreshing" class="notif-empty">
            <span class="notif-empty-icon">✨</span>
            <span class="notif-empty-text">暂无待处理提醒</span>
            <span class="notif-empty-sub">所有宠物都很健康！</span>
          </div>

          <!-- 加载中 -->
          <div v-if="!showSettings && isRefreshing && allNotifications.length === 0" class="notif-loading">
            <div class="notif-loading-dot"></div>
            <span class="notif-loading-text">正在加载...</span>
          </div>

          <!-- 紧急 & 今日 -->
          <div v-if="!showSettings && criticalNotifs.length > 0" class="notif-group">
            <div class="notif-group-label" style="color: #EF4444;">
              <span>⚠️</span> 需要处理 ({{ criticalNotifs.length }})
            </div>
            <div
              v-for="notif in criticalNotifs"
              :key="'c-' + notif.type + '-' + (notif.sourceId || notif.petId)"
              class="notif-item"
              :class="{ 'notif-item-birthday': isBirthday(notif) }"
              :style="{
                borderLeftColor: getUrgencyBorder(notif),
                background: getUrgencyBg(notif)
              }"
              @click="handleNotificationClick(notif)"
            >
              <span class="notif-item-icon" :style="{ background: getTypeConfig(notif.type).color + '18' }">
                {{ getTypeConfig(notif.type).icon }}
              </span>
              <div class="notif-item-content">
                <span class="notif-item-pet">{{ notif.petName }}</span>
                <span class="notif-item-event">{{ notif.message }}</span>
                <span v-if="notif.detail" class="notif-item-detail">{{ notif.detail }}</span>
              </div>
              <span
                class="notif-item-badge"
                :style="{ background: getUrgencyBadgeBg(notif), color: '#fff' }"
              >
                {{ getUrgencyLabel(notif) }}
              </span>
            </div>
          </div>

          <!-- 提醒类 -->
          <div v-if="!showSettings && warningNotifs.length > 0" class="notif-group">
            <div class="notif-group-label" style="color: #F97316;">
              <span>📋</span> 提醒 ({{ warningNotifs.length }})
            </div>
            <div
              v-for="notif in warningNotifs"
              :key="'w-' + notif.type + '-' + (notif.sourceId || notif.petId)"
              class="notif-item"
              :class="{ 'notif-item-birthday': isBirthday(notif) }"
              :style="{
                borderLeftColor: getUrgencyBorder(notif),
                background: getUrgencyBg(notif)
              }"
              @click="handleNotificationClick(notif)"
            >
              <span class="notif-item-icon" :style="{ background: getTypeConfig(notif.type).color + '18' }">
                {{ getTypeConfig(notif.type).icon }}
              </span>
              <div class="notif-item-content">
                <span class="notif-item-pet">{{ notif.petName }}</span>
                <span class="notif-item-event">{{ notif.message }}</span>
                <span v-if="notif.detail" class="notif-item-detail">{{ notif.detail }}</span>
              </div>
              <span
                class="notif-item-badge"
                :style="{ background: getUrgencyBadgeBg(notif), color: '#fff' }"
              >
                {{ getUrgencyLabel(notif) }}
              </span>
            </div>
          </div>

          <!-- 信息类 -->
          <div v-if="!showSettings && infoNotifs.length > 0" class="notif-group">
            <div class="notif-group-label" style="color: #3B82F6;">
              <span>ℹ️</span> 信息 ({{ infoNotifs.length }})
            </div>
            <div
              v-for="notif in infoNotifs"
              :key="'i-' + notif.type + '-' + (notif.sourceId || notif.petId)"
              class="notif-item"
              :class="{ 'notif-item-birthday': isBirthday(notif) }"
              :style="{
                borderLeftColor: getUrgencyBorder(notif),
                background: getUrgencyBg(notif)
              }"
              @click="handleNotificationClick(notif)"
            >
              <span class="notif-item-icon" :style="{ background: getTypeConfig(notif.type).color + '18' }">
                {{ getTypeConfig(notif.type).icon }}
              </span>
              <div class="notif-item-content">
                <span class="notif-item-pet">{{ notif.petName }}</span>
                <span class="notif-item-event">{{ notif.message }}</span>
                <span v-if="notif.detail" class="notif-item-detail">{{ notif.detail }}</span>
              </div>
              <span
                class="notif-item-badge"
                :style="{ background: getUrgencyBadgeBg(notif), color: '#fff' }"
              >
                {{ getUrgencyLabel(notif) }}
              </span>
            </div>
          </div>
        </div>

        <div class="notif-panel-footer">
          <span class="notif-footer-types">
            <span class="notif-type-dot" style="background: #EF4444;" title="健康">🩺</span>
            <span class="notif-type-dot" style="background: #8B5CF6;" title="用药">💊</span>
            <span class="notif-type-dot" style="background: #F59E0B;" title="喂养">🍽️</span>
            <span class="notif-type-dot" style="background: #06B6D4;" title="美容">🛁</span>
            <span class="notif-type-dot" style="background: #EC4899;" title="生日">🎂</span>
          </span>
          <span class="notif-footer-hint">点击通知查看详情</span>
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

[data-theme="dark"] .notif-bell-btn {
  background: rgba(61, 61, 92, 0.5);
  border-color: rgba(255, 155, 168, 0.08);
}

[data-theme="dark"] .notif-bell-btn:hover,
[data-theme="dark"] .notif-bell-btn.is-open {
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

/* Panel */
.notif-panel {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 400px;
  max-height: 540px;
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

[data-theme="dark"] .notif-panel {
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

/* Header */
.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(255, 155, 168, 0.1);
}

[data-theme="dark"] .notif-panel-header {
  border-bottom-color: rgba(255, 155, 168, 0.06);
}

.notif-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #2D2D2D;
}

[data-theme="dark"] .notif-panel-title {
  color: #F0F0F0;
}

.notif-panel-count {
  font-size: 12px;
  color: #9CA3AF;
  padding: 2px 10px;
  border-radius: 10px;
  background: rgba(255, 155, 168, 0.08);
}

[data-theme="dark"] .notif-panel-count {
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

/* Body */
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

/* Groups */
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

[data-theme="dark"] .notif-group-label {
  opacity: 0.85;
}

/* Items */
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
.notif-item:nth-child(6) { animation-delay: 0.15s; }
.notif-item:nth-child(7) { animation-delay: 0.18s; }

@keyframes notif-item-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.notif-item:hover {
  transform: translateX(3px);
  background: rgba(255, 155, 168, 0.1) !important;
}

[data-theme="dark"] .notif-item:hover {
  background: rgba(255, 155, 168, 0.08) !important;
}

.notif-item-icon {
  font-size: 18px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.notif-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.notif-item-pet {
  font-size: 12px;
  font-weight: 500;
  color: #9CA3AF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme="dark"] .notif-item-pet {
  color: #777;
}

.notif-item-event {
  font-size: 13px;
  font-weight: 600;
  color: #2D2D2D;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme="dark"] .notif-item-event {
  color: #E8E8E8;
}

.notif-item-detail {
  font-size: 11px;
  color: #9CA3AF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

[data-theme="dark"] .notif-item-detail {
  color: #777;
}

.notif-item-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

/* Empty */
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

[data-theme="dark"] .notif-empty-text {
  color: #D4D4D4;
}

.notif-empty-sub {
  font-size: 12px;
  color: #9CA3AF;
}

/* Loading */
.notif-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
}

.notif-loading-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 155, 168, 0.2);
  border-top-color: #FF7A8A;
  animation: loading-spin 0.8s linear infinite;
}

@keyframes loading-spin {
  to { transform: rotate(360deg); }
}

.notif-loading-text {
  font-size: 12px;
  color: #9CA3AF;
}

/* Footer */
.notif-panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 155, 168, 0.1);
  gap: 8px;
}

[data-theme="dark"] .notif-panel-footer {
  border-top-color: rgba(255, 155, 168, 0.06);
}

.notif-footer-types {
  display: flex;
  align-items: center;
  gap: 4px;
}

.notif-type-dot {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.notif-type-dot:hover {
  opacity: 1;
}

.notif-footer-hint {
  font-size: 11px;
  color: #9CA3AF;
}

/* Mobile */
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

/* Birthday notification special styling */
.notif-item-birthday {
  position: relative;
  overflow: hidden;
  border-left-color: #EC4899 !important;
}

.notif-item-birthday::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.06), transparent);
  animation: birthday-shimmer 3s ease-in-out infinite;
}

@keyframes birthday-shimmer {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}

.notif-item-birthday .notif-item-icon {
  animation: birthday-icon-bounce 2s ease-in-out infinite;
}

@keyframes birthday-icon-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.notif-item-birthday .notif-item-event {
  color: #DB2777;
}

[data-theme="dark"] .notif-item-birthday {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.06)) !important;
}

[data-theme="dark"] .notif-item-birthday .notif-item-event {
  color: #F9A8D4;
}

/* Settings Button */
.notif-settings-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: none;
  background: rgba(255, 155, 168, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  padding: 0;
}

.notif-settings-btn:hover {
  background: rgba(255, 155, 168, 0.15);
  transform: rotate(30deg) scale(1.1);
}

.notif-settings-btn.active {
  background: rgba(255, 155, 168, 0.2);
  transform: rotate(0deg);
}

/* Settings Panel */
.notif-settings {
  padding: 4px 16px 12px;
  animation: settings-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes settings-in {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.notif-settings-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9CA3AF;
  padding: 8px 0 6px;
}

[data-theme="dark"] .notif-settings-title {
  color: #777;
}

.notif-setting-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  transition: background 0.2s;
}

.notif-setting-row:hover {
  background: rgba(255, 155, 168, 0.06);
}

.notif-setting-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 15px;
  flex-shrink: 0;
}

.notif-setting-label {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #2D2D2D;
}

[data-theme="dark"] .notif-setting-label {
  color: #E8E8E8;
}

/* Toggle Switch */
.notif-toggle {
  position: relative;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  cursor: pointer;
}

.notif-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.notif-toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  background: #D1D5DB;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.notif-toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.notif-toggle input:checked + .notif-toggle-slider {
  background: #FF7A8A;
}

.notif-toggle input:checked + .notif-toggle-slider::before {
  transform: translateX(18px);
}

[data-theme="dark"] .notif-toggle-slider {
  background: #4B4B6B;
}

[data-theme="dark"] .notif-toggle input:checked + .notif-toggle-slider {
  background: #FF7A8A;
}

/* Threshold Rows */
.notif-threshold-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  transition: background 0.2s;
}

.notif-threshold-row:hover {
  background: rgba(255, 155, 168, 0.06);
}

.notif-threshold-icon {
  font-size: 15px;
  flex-shrink: 0;
  width: 30px;
  text-align: center;
}

.notif-threshold-label {
  flex: 1;
  font-size: 13px;
  color: #4A4A4A;
}

[data-theme="dark"] .notif-threshold-label {
  color: #C8C8C8;
}

.notif-threshold-input {
  width: 54px;
  height: 30px;
  border: 1px solid rgba(255, 155, 168, 0.2);
  border-radius: 10px;
  background: rgba(255, 245, 247, 0.5);
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #2D2D2D;
  outline: none;
  transition: all 0.2s;
}

.notif-threshold-input:focus {
  border-color: #FF7A8A;
  box-shadow: 0 0 0 3px rgba(255, 122, 138, 0.1);
}

[data-theme="dark"] .notif-threshold-input {
  background: rgba(61, 61, 92, 0.5);
  border-color: rgba(255, 155, 168, 0.12);
  color: #E8E8E8;
}

.notif-threshold-unit {
  font-size: 12px;
  color: #9CA3AF;
  flex-shrink: 0;
}

/* Save Button */
.notif-settings-save {
  width: 100%;
  margin-top: 14px;
  padding: 10px 0;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #FF7A8A, #FF9DB5);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  overflow: hidden;
}

.notif-settings-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 122, 138, 0.35);
}

.notif-settings-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.notif-settings-save::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.notif-settings-save:hover::after {
  left: 100%;
}
</style>
