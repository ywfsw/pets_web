<template>
  <div class="settings-page">
    <!-- Hero 区域 -->
    <div class="settings-hero">
      <div class="hero-decorations">
        <span class="deco deco-1">⚙️</span>
        <span class="deco deco-2">👤</span>
        <span class="deco deco-3">✨</span>
        <span class="deco deco-4">🔐</span>
        <span class="deco deco-5">🔔</span>
        <span class="deco deco-6">🐾</span>
      </div>
      <div class="hero-inner">
        <div class="hero-icon">⚙️</div>
        <h1 class="hero-title">账号设置</h1>
        <p class="hero-subtitle">管理你的个人信息和偏好配置</p>
      </div>
      <div class="hero-stats-bar" v-if="authStore.userInfo">
        <div class="hero-stat-item">
          <span class="hero-stat-icon">👤</span>
          <span class="hero-stat-value">{{ authStore.userInfo.username }}</span>
          <span class="hero-stat-label">用户名</span>
        </div>
        <div class="hero-stat-item">
          <span class="hero-stat-icon">🛡️</span>
          <span class="hero-stat-value">{{ authStore.userInfo.role === 'ADMIN' ? '管理员' : '普通用户' }}</span>
          <span class="hero-stat-label">角色</span>
        </div>
        <div class="hero-stat-item" v-if="authStore.userInfo.createdAt">
          <span class="hero-stat-icon">📅</span>
          <span class="hero-stat-value">{{ formatDate(authStore.userInfo.createdAt) }}</span>
          <span class="hero-stat-label">注册时间</span>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="settings-content section-entrance">
      <!-- 账号信息卡片 -->
      <div class="settings-section account-section">
        <div class="section-header">
          <span class="section-icon">👤</span>
          <h2 class="section-title">账号信息</h2>
        </div>
        <div class="account-card">
          <div class="account-avatar-area">
            <div class="account-avatar">
              <span class="avatar-emoji">{{ authStore.userInfo?.role === 'ADMIN' ? '👑' : '🐾' }}</span>
            </div>
            <div class="account-info">
              <div class="account-name">{{ authStore.userInfo?.username || '未知用户' }}</div>
              <div class="account-role-badge" :class="authStore.userInfo?.role === 'ADMIN' ? 'role-admin' : 'role-user'">
                {{ authStore.userInfo?.role === 'ADMIN' ? '管理员' : '普通用户' }}
              </div>
            </div>
          </div>
          <div class="account-details">
            <div class="detail-row">
              <span class="detail-icon">🏷️</span>
              <span class="detail-label">用户 ID</span>
              <span class="detail-value">#{{ authStore.userInfo?.id }}</span>
            </div>
            <div class="detail-row" v-if="authStore.userInfo?.createdAt">
              <span class="detail-icon">📅</span>
              <span class="detail-label">注册时间</span>
              <span class="detail-value">{{ formatDate(authStore.userInfo.createdAt) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-icon">🛡️</span>
              <span class="detail-label">账号状态</span>
              <span class="detail-value status-active">正常</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 修改密码卡片 -->
      <div class="settings-section password-section">
        <div class="section-header">
          <span class="section-icon">🔐</span>
          <h2 class="section-title">修改密码</h2>
        </div>
        <div class="password-card">
          <form @submit.prevent="handleChangePassword" class="password-form">
            <div class="form-group">
              <label class="form-label">原密码</label>
              <div class="input-wrapper">
                <input
                  :type="showOldPassword ? 'text' : 'password'"
                  v-model="passwordForm.oldPassword"
                  placeholder="请输入当前密码"
                  class="form-input"
                  autocomplete="current-password"
                />
                <button type="button" class="toggle-password" @click="showOldPassword = !showOldPassword">
                  {{ showOldPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">新密码</label>
              <div class="input-wrapper">
                <input
                  :type="showNewPassword ? 'text' : 'password'"
                  v-model="passwordForm.newPassword"
                  placeholder="请输入新密码（6-50 个字符）"
                  class="form-input"
                  autocomplete="new-password"
                />
                <button type="button" class="toggle-password" @click="showNewPassword = !showNewPassword">
                  {{ showNewPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              <div class="password-strength" v-if="passwordForm.newPassword">
                <div class="strength-bar">
                  <div class="strength-fill" :class="passwordStrength.class" :style="{ width: passwordStrength.width }"></div>
                </div>
                <span class="strength-label" :class="passwordStrength.class">{{ passwordStrength.label }}</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">确认新密码</label>
              <div class="input-wrapper">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  v-model="passwordForm.confirmPassword"
                  placeholder="请再次输入新密码"
                  class="form-input"
                  autocomplete="new-password"
                />
                <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                  {{ showConfirmPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              <div class="form-hint error" v-if="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword">
                ⚠️ 两次输入的密码不一致
              </div>
            </div>
            <button
              type="submit"
              class="submit-btn password-submit"
              :disabled="changingPassword || !canSubmitPassword"
              :class="{ 'btn-loading': changingPassword }"
            >
              <span v-if="changingPassword" class="btn-spinner"></span>
              <span v-else>🔑</span>
              {{ changingPassword ? '修改中...' : '修改密码' }}
            </button>
          </form>
        </div>
      </div>

      <!-- 通知偏好卡片 -->
      <div class="settings-section notification-section">
        <div class="section-header">
          <span class="section-icon">🔔</span>
          <h2 class="section-title">通知偏好</h2>
        </div>
        <div class="notification-card">
          <div v-if="loadingPrefs" class="prefs-loading">
            <div class="prefs-loading-dot"></div>
            <div class="prefs-loading-dot"></div>
            <div class="prefs-loading-dot"></div>
          </div>
          <div v-else class="prefs-list">
            <div class="pref-item" v-for="pref in prefItems" :key="pref.key">
              <div class="pref-info">
                <span class="pref-icon">{{ pref.icon }}</span>
                <div class="pref-text">
                  <span class="pref-name">{{ pref.label }}</span>
                  <span class="pref-desc">{{ pref.description }}</span>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="localPrefs[pref.key]" @change="handlePrefChange" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="pref-item pref-threshold">
              <div class="pref-info">
                <span class="pref-icon">📅</span>
                <div class="pref-text">
                  <span class="pref-name">提前提醒天数</span>
                  <span class="pref-desc">提前多少天提醒即将到来的健康事件</span>
                </div>
              </div>
              <div class="threshold-control">
                <button class="threshold-btn" @click="adjustThreshold(-1)" :disabled="localPrefs.healthDaysBefore <= 1">−</button>
                <span class="threshold-value">{{ localPrefs.healthDaysBefore }} 天</span>
                <button class="threshold-btn" @click="adjustThreshold(1)" :disabled="localPrefs.healthDaysBefore >= 30">+</button>
              </div>
            </div>
            <div class="pref-item pref-threshold">
              <div class="pref-info">
                <span class="pref-icon">🎂</span>
                <div class="pref-text">
                  <span class="pref-name">生日提醒天数</span>
                  <span class="pref-desc">提前多少天提醒宠物生日</span>
                </div>
              </div>
              <div class="threshold-control">
                <button class="threshold-btn" @click="adjustBirthdayDays(-1)" :disabled="localPrefs.birthdayDaysBefore <= 1">−</button>
                <span class="threshold-value">{{ localPrefs.birthdayDaysBefore }} 天</span>
                <button class="threshold-btn" @click="adjustBirthdayDays(1)" :disabled="localPrefs.birthdayDaysBefore >= 30">+</button>
              </div>
            </div>
          </div>
          <div class="pref-save-hint" v-if="prefsDirty">
            <span>💾</span> 偏好已自动保存
          </div>
        </div>
      </div>

      <!-- 数据概况卡片 -->
      <div class="settings-section data-section">
        <div class="section-header">
          <span class="section-icon">📊</span>
          <h2 class="section-title">数据概况</h2>
        </div>
        <div class="data-card">
          <div class="data-grid" v-if="summaryData">
            <div class="data-item" v-for="item in dataItems" :key="item.label">
              <span class="data-icon">{{ item.icon }}</span>
              <span class="data-value">{{ item.value }}</span>
              <span class="data-label">{{ item.label }}</span>
            </div>
          </div>
          <div class="data-empty" v-else>
            <span class="data-empty-emoji">📊</span>
            <span>加载中...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore.js'
import { usePetStore } from '@/stores/petStore.js'
import { useMessage } from 'naive-ui'
import { fetchDashboardSummary } from '@/api.js'

const authStore = useAuthStore()
const petStore = usePetStore()
const message = useMessage()

// --- 修改密码 ---
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const changingPassword = ref(false)
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const canSubmitPassword = computed(() => {
  return passwordForm.oldPassword.trim()
    && passwordForm.newPassword.trim()
    && passwordForm.newPassword.length >= 6
    && passwordForm.newPassword === passwordForm.confirmPassword
})

const passwordStrength = computed(() => {
  const pwd = passwordForm.newPassword
  if (!pwd) return { width: '0%', class: '', label: '' }
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++

  if (score <= 1) return { width: '20%', class: 'strength-weak', label: '弱' }
  if (score <= 2) return { width: '40%', class: 'strength-fair', label: '一般' }
  if (score <= 3) return { width: '60%', class: 'strength-good', label: '良好' }
  if (score <= 4) return { width: '80%', class: 'strength-strong', label: '强' }
  return { width: '100%', class: 'strength-excellent', label: '非常强' }
})

async function handleChangePassword() {
  if (!canSubmitPassword.value) return
  changingPassword.value = true
  try {
    const success = await authStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    if (success) {
      message.success('密码修改成功，请重新登录')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } else {
      message.error(authStore.error || '修改密码失败')
    }
  } catch {
    message.error('修改密码失败，请重试')
  } finally {
    changingPassword.value = false
  }
}

// --- 通知偏好 ---
const localPrefs = reactive({
  healthEnabled: true,
  medicationEnabled: true,
  feedingEnabled: true,
  bathingEnabled: true,
  birthdayEnabled: true,
  healthDaysBefore: 7,
  birthdayDaysBefore: 7
})
const loadingPrefs = ref(true)
const prefsDirty = ref(false)
const prefSaveTimer = ref(null)

const prefItems = [
  { key: 'healthEnabled', icon: '🩺', label: '健康事件提醒', description: '疫苗、驱虫、体检等待办事项' },
  { key: 'medicationEnabled', icon: '💊', label: '用药提醒', description: '用药记录即将结束或已过期' },
  { key: 'feedingEnabled', icon: '🍽️', label: '喂养提醒', description: '今日未喂食提醒' },
  { key: 'bathingEnabled', icon: '🛁', label: '美容提醒', description: '超过 30 天未美容护理' },
  { key: 'birthdayEnabled', icon: '🎂', label: '生日提醒', description: '宠物生日即将到来' }
]

async function loadPrefs() {
  loadingPrefs.value = true
  try {
    await petStore.loadNotificationPrefs()
    if (petStore.notificationPrefs) {
      localPrefs.healthEnabled = petStore.notificationPrefs.healthEnabled ?? true
      localPrefs.medicationEnabled = petStore.notificationPrefs.medicationEnabled ?? true
      localPrefs.feedingEnabled = petStore.notificationPrefs.feedingEnabled ?? true
      localPrefs.bathingEnabled = petStore.notificationPrefs.bathingEnabled ?? true
      localPrefs.birthdayEnabled = petStore.notificationPrefs.birthdayEnabled ?? true
      localPrefs.healthDaysBefore = petStore.notificationPrefs.healthDaysBefore ?? 7
      localPrefs.birthdayDaysBefore = petStore.notificationPrefs.birthdayDaysBefore ?? 7
    }
  } catch {
    // 使用默认值
  } finally {
    loadingPrefs.value = false
  }
}

function handlePrefChange() {
  prefsDirty.value = true
  if (prefSaveTimer.value) clearTimeout(prefSaveTimer.value)
  prefSaveTimer.value = setTimeout(async () => {
    try {
      await petStore.updateNotificationPrefs({ ...localPrefs })
      setTimeout(() => { prefsDirty.value = false }, 2000)
    } catch {
      message.error('保存偏好失败')
    }
  }, 800)
}

function adjustThreshold(delta) {
  const newVal = localPrefs.healthDaysBefore + delta
  if (newVal >= 1 && newVal <= 30) {
    localPrefs.healthDaysBefore = newVal
    handlePrefChange()
  }
}

function adjustBirthdayDays(delta) {
  const newVal = localPrefs.birthdayDaysBefore + delta
  if (newVal >= 1 && newVal <= 30) {
    localPrefs.birthdayDaysBefore = newVal
    handlePrefChange()
  }
}

// --- 数据概况 ---
const summaryData = ref(null)

const dataItems = computed(() => {
  const s = summaryData.value
  if (!s) return []
  return [
    { icon: '🐾', value: s.totalPets || 0, label: '宠物' },
    { icon: '📷', value: s.totalPhotos || 0, label: '照片' },
    { icon: '⚖️', value: s.totalWeightRecords || 0, label: '体重' },
    { icon: '🩺', value: s.totalHealthEvents || 0, label: '健康' },
    { icon: '🍽️', value: s.totalFeedings || 0, label: '喂养' },
    { icon: '💊', value: s.totalMedications || 0, label: '用药' },
    { icon: '🛁', value: s.totalBathingRecords || 0, label: '美容' }
  ]
})

// --- 工具函数 ---
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// --- 生命周期 ---
onMounted(async () => {
  loadPrefs()
  try {
    const res = await fetchDashboardSummary()
    summaryData.value = res.data
  } catch {
    // 忽略
  }
})
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px 60px;
}

/* === Hero === */
.settings-hero {
  position: relative;
  background: linear-gradient(135deg, rgba(255,155,168,0.18) 0%, rgba(186,130,255,0.18) 50%, rgba(125,211,252,0.12) 100%);
  border: 1px solid rgba(255,155,168,0.25);
  border-radius: 24px;
  padding: 40px 32px 28px;
  margin-bottom: 24px;
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.hero-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.deco {
  position: absolute;
  font-size: 22px;
  opacity: 0.25;
  animation: decoFloat 6s ease-in-out infinite;
}
.deco-1 { top: 12%; left: 8%; animation-delay: 0s; }
.deco-2 { top: 20%; right: 12%; animation-delay: 1s; }
.deco-3 { bottom: 25%; left: 15%; animation-delay: 2s; }
.deco-4 { top: 15%; left: 35%; animation-delay: 0.5s; }
.deco-5 { bottom: 20%; right: 20%; animation-delay: 1.5s; }
.deco-6 { top: 40%; right: 8%; animation-delay: 3s; }

@keyframes decoFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(8deg); }
}

.hero-inner {
  text-align: center;
  margin-bottom: 20px;
}

.hero-icon {
  font-size: 40px;
  animation: heroIconBounce 2s ease-in-out infinite;
  margin-bottom: 8px;
}

@keyframes heroIconBounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.08); }
}

.hero-title {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #FF9BA8 0%, #BA82FF 50%, #7DD3FC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 6px;
}

.hero-subtitle {
  font-size: 14px;
  color: #8B7B8B;
  margin: 0;
}

.hero-stats-bar {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 14px 20px;
  background: rgba(255,255,255,0.5);
  border-radius: 16px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,155,168,0.12);
}

.hero-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hero-stat-icon {
  font-size: 18px;
}

.hero-stat-value {
  font-size: 14px;
  font-weight: 700;
  color: #2D2D2D;
}

.hero-stat-label {
  font-size: 11px;
  color: #9CA3AF;
}

/* === Content === */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  animation: sectionEntrance 0.5s cubic-bezier(0.22,1,0.36,1) both;
}
.account-section { animation-delay: 0.1s; }
.password-section { animation-delay: 0.2s; }
.notification-section { animation-delay: 0.3s; }
.data-section { animation-delay: 0.4s; }

@keyframes sectionEntrance {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.section-icon {
  font-size: 22px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2D2D2D;
  margin: 0;
}

/* === Cards (glassmorphism) === */
.account-card,
.password-card,
.notification-card,
.data-card {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(255,155,168,0.08);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.account-card:hover,
.password-card:hover,
.notification-card:hover,
.data-card:hover {
  box-shadow: 0 8px 32px rgba(255,155,168,0.14);
  transform: translateY(-2px);
}

/* === Account Info === */
.account-avatar-area {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.account-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,155,168,0.3), rgba(186,130,255,0.3));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  animation: avatarPulse 3s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes avatarPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,155,168,0.3); }
  50% { box-shadow: 0 0 0 8px rgba(255,155,168,0.08); }
}

.account-name {
  font-size: 20px;
  font-weight: 800;
  color: #2D2D2D;
}

.account-role-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}

.role-admin {
  background: linear-gradient(135deg, rgba(255,155,168,0.2), rgba(186,130,255,0.2));
  color: #BA82FF;
  border: 1px solid rgba(186,130,255,0.3);
}

.role-user {
  background: rgba(125,211,252,0.15);
  color: #0EA5E9;
  border: 1px solid rgba(125,211,252,0.3);
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(0,0,0,0.02);
  border-radius: 12px;
  transition: background 0.2s ease;
}

.detail-row:hover {
  background: rgba(255,155,168,0.06);
}

.detail-icon {
  font-size: 16px;
}

.detail-label {
  font-size: 13px;
  color: #9CA3AF;
  min-width: 70px;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #2D2D2D;
  margin-left: auto;
}

.status-active {
  color: #059669;
}

/* === Password Form === */
.password-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #6B6B6B;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 12px 44px 12px 16px;
  border: 1.5px solid rgba(0,0,0,0.1);
  border-radius: 14px;
  font-size: 14px;
  background: rgba(255,255,255,0.7);
  color: #2D2D2D;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;
  font-family: inherit;
}

.form-input:hover {
  border-color: rgba(255,155,168,0.4);
  box-shadow: 0 2px 8px rgba(255,155,168,0.08);
}

.form-input:focus {
  border-color: #FF9BA8;
  box-shadow: 0 0 0 3px rgba(255,155,168,0.15);
}

.form-input::placeholder {
  color: #C4B5C4;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.toggle-password:hover {
  opacity: 1;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: rgba(0,0,0,0.06);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease, background 0.4s ease;
}

.strength-weak { background: #FCA5A5; }
.strength-fair { background: #FCD34D; }
.strength-good { background: #93C5FD; }
.strength-strong { background: #86EFAC; }
.strength-excellent { background: #34D399; }

.strength-label {
  font-size: 11px;
  font-weight: 600;
  min-width: 40px;
}
.strength-label.strength-weak { color: #EF4444; }
.strength-label.strength-fair { color: #D97706; }
.strength-label.strength-good { color: #3B82F6; }
.strength-label.strength-strong { color: #059669; }
.strength-label.strength-excellent { color: #059669; }

.form-hint {
  font-size: 12px;
  color: #9CA3AF;
}

.form-hint.error {
  color: #EF4444;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
  position: relative;
  overflow: hidden;
  font-family: inherit;
}

.password-submit {
  background: linear-gradient(135deg, #FF9BA8, #BA82FF);
  color: white;
  box-shadow: 0 4px 16px rgba(255,155,168,0.3);
}

.password-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255,155,168,0.4);
}

.password-submit::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.password-submit:hover::after {
  left: 100%;
}

.password-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* === Notification Preferences === */
.prefs-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pref-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 14px;
  transition: background 0.2s ease;
}

.pref-item:hover {
  background: rgba(255,155,168,0.04);
}

.pref-info {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.pref-icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,155,168,0.08);
  border-radius: 12px;
  flex-shrink: 0;
}

.pref-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pref-name {
  font-size: 14px;
  font-weight: 600;
  color: #2D2D2D;
}

.pref-desc {
  font-size: 12px;
  color: #9CA3AF;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.1);
  border-radius: 13px;
  transition: background 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
}

.toggle-switch input:checked + .toggle-slider {
  background: linear-gradient(135deg, #FF9BA8, #BA82FF);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(22px);
}

/* Threshold Control */
.threshold-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.threshold-btn {
  width: 32px;
  height: 32px;
  border: 1.5px solid rgba(0,0,0,0.1);
  border-radius: 10px;
  background: rgba(255,255,255,0.6);
  font-size: 16px;
  font-weight: 700;
  color: #6B6B6B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-family: inherit;
}

.threshold-btn:hover:not(:disabled) {
  background: rgba(255,155,168,0.1);
  border-color: rgba(255,155,168,0.4);
  color: #FF9BA8;
}

.threshold-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.threshold-value {
  font-size: 15px;
  font-weight: 700;
  color: #2D2D2D;
  min-width: 40px;
  text-align: center;
}

.prefs-loading {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 30px;
}

.prefs-loading-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,155,168,0.4);
  animation: prefsDot 1.2s ease-in-out infinite;
}
.prefs-loading-dot:nth-child(2) { animation-delay: 0.15s; }
.prefs-loading-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes prefsDot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.pref-save-hint {
  text-align: right;
  font-size: 12px;
  color: #059669;
  margin-top: 8px;
  animation: fadeInHint 0.3s ease;
}

@keyframes fadeInHint {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === Data Overview === */
.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 12px;
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  border-radius: 16px;
  background: rgba(255,155,168,0.04);
  transition: background 0.2s ease, transform 0.2s ease;
}

.data-item:hover {
  background: rgba(255,155,168,0.1);
  transform: translateY(-2px);
}

.data-icon {
  font-size: 22px;
}

.data-value {
  font-size: 20px;
  font-weight: 800;
  color: #2D2D2D;
  font-variant-numeric: tabular-nums;
}

.data-label {
  font-size: 11px;
  color: #9CA3AF;
}

.data-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: #9CA3AF;
  font-size: 14px;
}

.data-empty-emoji {
  font-size: 20px;
  animation: heroIconBounce 2s ease-in-out infinite;
}

/* === Dark Theme === */
:root[data-theme="dark"] .settings-hero {
  background: linear-gradient(135deg, rgba(255,155,168,0.08) 0%, rgba(186,130,255,0.08) 50%, rgba(125,211,252,0.05) 100%);
  border-color: rgba(255,155,168,0.15);
}

:root[data-theme="dark"] .hero-stats-bar {
  background: rgba(37,37,66,0.5);
  border-color: rgba(255,155,168,0.08);
}

:root[data-theme="dark"] .hero-stat-value {
  color: #E8E0E8;
}

:root[data-theme="dark"] .section-title,
:root[data-theme="dark"] .account-name,
:root[data-theme="dark"] .pref-name,
:root[data-theme="dark"] .threshold-value,
:root[data-theme="dark"] .data-value {
  color: #E8E0E8;
}

:root[data-theme="dark"] .account-card,
:root[data-theme="dark"] .password-card,
:root[data-theme="dark"] .notification-card,
:root[data-theme="dark"] .data-card {
  background: rgba(37,37,66,0.6);
  border-color: rgba(255,155,168,0.1);
}

:root[data-theme="dark"] .detail-row {
  background: rgba(255,255,255,0.03);
}

:root[data-theme="dark"] .detail-row:hover {
  background: rgba(255,155,168,0.06);
}

:root[data-theme="dark"] .detail-value {
  color: #E8E0E8;
}

:root[data-theme="dark"] .form-input {
  background: rgba(37,37,66,0.5);
  border-color: rgba(255,255,255,0.1);
  color: #E8E0E8;
}

:root[data-theme="dark"] .form-input:focus {
  border-color: #FF9BA8;
  box-shadow: 0 0 0 3px rgba(255,155,168,0.1);
}

:root[data-theme="dark"] .pref-item:hover {
  background: rgba(255,155,168,0.04);
}

:root[data-theme="dark"] .pref-icon {
  background: rgba(255,155,168,0.08);
}

:root[data-theme="dark"] .threshold-btn {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.1);
  color: #B8A8B8;
}

:root[data-theme="dark"] .toggle-slider {
  background: rgba(255,255,255,0.1);
}

:root[data-theme="dark"] .data-item {
  background: rgba(255,155,168,0.04);
}

:root[data-theme="dark"] .data-item:hover {
  background: rgba(255,155,168,0.08);
}

:root[data-theme="dark"] .account-avatar-area {
  border-bottom-color: rgba(255,255,255,0.06);
}

:root[data-theme="dark"] .hero-subtitle {
  color: #B8A8B8;
}

:root[data-theme="dark"] .form-label {
  color: #B8A8B8;
}

:root[data-theme="dark"] .pref-desc {
  color: #7B6B7B;
}

:root[data-theme="dark"] .detail-label {
  color: #7B6B7B;
}

/* === Mobile Responsive === */
@media (max-width: 768px) {
  .settings-page {
    padding: 0 12px 40px;
  }

  .settings-hero {
    padding: 28px 20px 20px;
    border-radius: 20px;
  }

  .hero-title {
    font-size: 22px;
  }

  .hero-stats-bar {
    gap: 16px;
    padding: 12px 14px;
    flex-wrap: wrap;
    justify-content: space-around;
  }

  .hero-stat-value {
    font-size: 12px;
  }

  .account-card,
  .password-card,
  .notification-card,
  .data-card {
    padding: 18px;
    border-radius: 16px;
  }

  .account-avatar-area {
    gap: 12px;
  }

  .account-avatar {
    width: 52px;
    height: 52px;
    font-size: 24px;
  }

  .account-name {
    font-size: 17px;
  }

  .pref-item {
    padding: 10px 12px;
  }

  .pref-icon {
    width: 34px;
    height: 34px;
    font-size: 18px;
  }

  .pref-name {
    font-size: 13px;
  }

  .data-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 8px;
  }

  .data-item {
    padding: 10px 6px;
  }

  .data-value {
    font-size: 17px;
  }
}

@media (max-width: 480px) {
  .settings-hero {
    padding: 22px 16px 16px;
  }

  .hero-icon {
    font-size: 32px;
  }

  .hero-title {
    font-size: 19px;
  }

  .section-title {
    font-size: 16px;
  }

  .form-input {
    padding: 10px 40px 10px 14px;
    font-size: 13px;
  }

  .submit-btn {
    padding: 12px 20px;
    font-size: 14px;
  }
}

/* === Dark Mode === */
.dark-mode .settings-hero {
  background: linear-gradient(135deg, rgba(255,100,120,0.12) 0%, rgba(150,80,220,0.12) 50%, rgba(80,170,240,0.08) 100%);
  border-color: rgba(255,155,168,0.15);
}

.dark-mode .hero-subtitle {
  color: #9B8B9B;
}

.dark-mode .hero-stats-bar {
  background: rgba(40,40,65,0.6);
  border-color: rgba(255,155,168,0.1);
}

.dark-mode .hero-stat-value {
  color: #E8E8E8;
}

.dark-mode .hero-stat-label {
  color: #7B7B8B;
}

.dark-mode .section-title {
  color: #E8E8E8;
}

.dark-mode .account-card,
.dark-mode .password-card,
.dark-mode .notification-card,
.dark-mode .data-card {
  background: rgba(40,40,65,0.7);
  border-color: rgba(255,255,255,0.08);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.dark-mode .account-card:hover,
.dark-mode .password-card:hover,
.dark-mode .notification-card:hover,
.dark-mode .data-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.dark-mode .account-avatar-area {
  border-bottom-color: rgba(255,255,255,0.06);
}

.dark-mode .account-name {
  color: #E8E8E8;
}

.dark-mode .detail-label {
  color: #9B9BAE;
}

.dark-mode .detail-value {
  color: #E0E0E0;
}

.dark-mode .form-label {
  color: #C8C8D8;
}

.dark-mode .form-input {
  background: rgba(30,30,50,0.6);
  border-color: rgba(255,255,255,0.1);
  color: #E8E8E8;
}

.dark-mode .form-input:focus {
  border-color: #FF9DB5;
  box-shadow: 0 0 0 3px rgba(255,122,138,0.15);
}

.dark-mode .form-input::placeholder {
  color: #6B6B7B;
}

.dark-mode .toggle-password {
  color: #8B8B9B;
}

.dark-mode .toggle-password:hover {
  color: #FF9DB5;
}

.dark-mode .form-hint {
  color: #8B8B9B;
}

.dark-mode .pref-icon {
  background: rgba(255,155,168,0.08);
}

.dark-mode .pref-name {
  color: #E8E8E8;
}

.dark-mode .pref-desc {
  color: #8B8B9B;
}

.dark-mode .toggle-slider {
  background: #4B4B6B;
}

.dark-mode .toggle-input:checked + .toggle-slider {
  background: #FF7A8A;
}

.dark-mode .threshold-btn {
  background: rgba(255,155,168,0.1);
  border-color: rgba(255,155,168,0.15);
  color: #E8E8E8;
}

.dark-mode .threshold-btn:hover:not(:disabled) {
  background: rgba(255,155,168,0.2);
}

.dark-mode .threshold-value {
  color: #E8E8E8;
}

.dark-mode .pref-save-hint {
  background: rgba(255,155,168,0.08);
  color: #FF9DB5;
}

.dark-mode .data-icon {
  background: rgba(255,155,168,0.08);
}

.dark-mode .data-value {
  color: #E8E8E8;
}

.dark-mode .data-label {
  color: #8B8B9B;
}

.dark-mode .data-empty {
  color: #8B8B9B;
}

.dark-mode .password-strength .strength-label {
  color: #8B8B9B;
}

.dark-mode .strength-bar {
  background: rgba(255,255,255,0.06);
}

.dark-mode .account-role-badge.role-admin {
  background: rgba(186,130,255,0.15);
  color: #C4A5FF;
}

.dark-mode .account-role-badge.role-user {
  background: rgba(125,211,252,0.15);
  color: #7DD3FC;
}

.dark-mode .status-active {
  color: #34D399;
}

.dark-mode .success-msg {
  background: rgba(52,211,153,0.1);
  border-color: rgba(52,211,153,0.2);
  color: #6EE7B7;
}

.dark-mode .error-msg {
  background: rgba(248,113,113,0.1);
  border-color: rgba(248,113,113,0.2);
  color: #FCA5A5;
}
</style>
