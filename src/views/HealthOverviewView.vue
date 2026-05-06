<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { NSelect } from 'naive-ui';
import { usePetStore } from '@/stores/petStore.js';
import { fetchPetDetail } from '@/api.js';
import WeightTrendChart from '@/components/WeightTrendChart.vue';

const petStore = usePetStore();

const selectedPetId = ref(null);
const petDetail = ref(null);
const loading = ref(false);

const petOptions = computed(() =>
  petStore.petList.map(p => ({
    label: p.name,
    value: p.id,
  }))
);

const weightLogs = computed(() => petDetail.value?.weightLogs || []);
const healthEvents = computed(() => petDetail.value?.healthEvents || []);
const medicationRecords = computed(() => petDetail.value?.medicationRecords || []);
const bathingRecords = computed(() => petDetail.value?.bathingRecords || []);
const latestWeight = computed(() => {
  const logs = weightLogs.value;
  if (!logs.length) return null;
  const sorted = [...logs].sort((a, b) => new Date(b.logDate) - new Date(a.logDate));
  return sorted[0];
});

const pendingEvents = computed(() =>
  healthEvents.value.filter(e => !e.status || e.status === 0)
);

const completedEvents = computed(() =>
  healthEvents.value.filter(e => e.status === 1)
);

const activeMedications = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return medicationRecords.value.filter(m => !m.endDate || m.endDate >= today);
});

const overdueEvents = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return pendingEvents.value.filter(e => e.nextDueDate && e.nextDueDate < today);
});

const upcomingEvents = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return pendingEvents.value
    .filter(e => e.nextDueDate && e.nextDueDate >= today)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 5);
});

const healthScore = computed(() => {
  let score = 100;
  if (overdueEvents.value.length > 0) score -= overdueEvents.value.length * 15;
  if (pendingEvents.value.length > 3) score -= (pendingEvents.value.length - 3) * 5;
  if (!latestWeight.value) score -= 10;
  if (activeMedications.value.length > 2) score -= 5;
  return Math.max(0, Math.min(100, score));
});

const scoreColor = computed(() => {
  const s = healthScore.value;
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  return '#ef4444';
});

const scoreLabel = computed(() => {
  const s = healthScore.value;
  if (s >= 80) return '优秀';
  if (s >= 60) return '良好';
  if (s >= 40) return '一般';
  return '需关注';
});

const eventTypeBreakdown = computed(() => {
  const map = {};
  healthEvents.value.forEach(e => {
    const label = e.eventTypeLabel || '其他';
    map[label] = (map[label] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
});

const maxEventTypeCount = computed(() =>
  Math.max(...eventTypeBreakdown.value.map(t => t.count), 1)
);

const recentActivities = computed(() => {
  const items = [];
  healthEvents.value.forEach(e => {
    items.push({
      type: 'health',
      icon: '🩺',
      label: e.eventTypeLabel || '健康事件',
      date: e.eventDate || e.nextDueDate,
      color: e.status === 1 ? '#10b981' : '#f59e0b',
    });
  });
  medicationRecords.value.forEach(m => {
    items.push({
      type: 'medication',
      icon: '💊',
      label: m.medicationName || '用药记录',
      date: m.startDate,
      color: '#a78bfa',
    });
  });
  bathingRecords.value.forEach(b => {
    items.push({
      type: 'bathing',
      icon: '🛁',
      label: b.serviceType || '洗澡美容',
      date: b.serviceDate,
      color: '#06b6d4',
    });
  });
  items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return items.slice(0, 8);
});

function computeAge(birthday) {
  if (!birthday) return null;
  const birth = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years > 0) return `${years}岁${months > 0 ? months + '个月' : ''}`;
  if (months > 0) return `${months}个月`;
  const days = Math.floor((now - birth) / 86400000);
  return days > 0 ? `${days}天` : null;
}

function getEventIcon(label) {
  if (!label) return '📋';
  const l = label.toLowerCase();
  if (l.includes('疫苗') || l.includes('vaccine')) return '💉';
  if (l.includes('驱虫') || l.includes('worm')) return '🐛';
  if (l.includes('体检') || l.includes('check')) return '🩺';
  if (l.includes('手术') || l.includes('surgery')) return '🏥';
  if (l.includes('牙') || l.includes('dental')) return '🦷';
  if (l.includes('眼') || l.includes('eye')) return '👁️';
  if (l.includes('狂犬')) return '💉';
  return '📋';
}

function formatDate(d) {
  if (!d) return '';
  return d.slice(0, 10);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

async function loadPetDetail() {
  if (!selectedPetId.value) { petDetail.value = null; return; }
  loading.value = true;
  try {
    const res = await fetchPetDetail(selectedPetId.value);
    petDetail.value = res.data;
  } catch (err) {
    console.error('加载宠物详情失败:', err);
  } finally {
    loading.value = false;
  }
}

watch(selectedPetId, loadPetDetail);

onMounted(async () => {
  if (petStore.petList.length === 0) {
    await petStore.loadPetList(1);
  }
  if (petStore.petList.length > 0 && !selectedPetId.value) {
    selectedPetId.value = petStore.petList[0].id;
  }
});

const navigateTo = (page) => {
  petStore.activePage = page;
};
</script>

<template>
  <div class="health-overview">
    <!-- Hero -->
    <div class="hero-wrapper section-entrance">
      <div class="hero-card">
        <div class="hero-bg"></div>
        <span class="float-decor d1">💚</span>
        <span class="float-decor d2">🩺</span>
        <span class="float-decor d3">✨</span>
        <span class="float-decor d4">🌿</span>
        <span class="float-decor d5">💪</span>
        <span class="float-decor d6">🐾</span>
        <div class="hero-content">
          <div class="hero-title-row">
            <span class="hero-emoji">💚</span>
            <h1 class="hero-title">健康概览</h1>
          </div>
          <p class="hero-subtitle">全面了解宠物的健康状况</p>
          <div class="hero-pet-selector">
            <n-select
              :value="selectedPetId"
              :options="petOptions"
              placeholder="选择一只宠物..."
              clearable
              size="medium"
              class="pet-selector"
              @update:value="selectedPetId = $event"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <!-- Skeleton: Pet info card -->
      <div class="skeleton-card pet-info-skeleton section-entrance" style="--entrance-delay: 0.05s;">
        <div class="skel-circle skel-shimmer" style="width:56px;height:56px;" />
        <div class="skel-text-group">
          <div class="skel-line skel-shimmer" style="width:120px;height:20px;" />
          <div class="skel-tags-row">
            <div class="skel-line skel-shimmer" style="width:48px;height:20px;border-radius:10px;" />
            <div class="skel-line skel-shimmer" style="width:56px;height:20px;border-radius:10px;" />
            <div class="skel-line skel-shimmer" style="width:64px;height:20px;border-radius:10px;" />
          </div>
        </div>
      </div>
      <!-- Skeleton: Score + Stats -->
      <div class="score-stats-section section-entrance" style="--entrance-delay: 0.1s;">
        <div class="skeleton-card score-skeleton">
          <div class="skel-circle skel-shimmer" style="width:80px;height:80px;" />
          <div class="skel-line skel-shimmer" style="width:60px;height:12px;margin:10px auto 0;" />
          <div class="skel-line skel-shimmer" style="width:40px;height:14px;margin:4px auto 0;" />
        </div>
        <div class="stats-grid">
          <div v-for="i in 4" :key="i" class="skeleton-card stat-skeleton">
            <div class="skel-line skel-shimmer" style="width:24px;height:24px;border-radius:50%;" />
            <div class="skel-line skel-shimmer" style="width:48px;height:18px;margin-top:6px;" />
            <div class="skel-line skel-shimmer" style="width:56px;height:10px;margin-top:4px;" />
          </div>
        </div>
      </div>
      <!-- Skeleton: Weight chart -->
      <div class="skeleton-card chart-skeleton section-entrance" style="--entrance-delay: 0.15s;">
        <div class="skel-header-row">
          <div class="skel-line skel-shimmer" style="width:16px;height:16px;" />
          <div class="skel-line skel-shimmer" style="width:80px;height:16px;" />
          <div class="skel-line skel-shimmer" style="width:56px;height:20px;border-radius:10px;" />
        </div>
        <div class="skel-line skel-shimmer" style="width:100%;height:180px;border-radius:12px;margin-top:12px;" />
      </div>
      <!-- Skeleton: Dual section -->
      <div class="dual-section section-entrance" style="--entrance-delay: 0.2s;">
        <div v-for="i in 2" :key="'dual'+i" class="skeleton-card sub-skeleton">
          <div class="skel-header-row">
            <div class="skel-line skel-shimmer" style="width:16px;height:16px;" />
            <div class="skel-line skel-shimmer" style="width:80px;height:16px;" />
            <div class="skel-line skel-shimmer" style="width:28px;height:20px;border-radius:10px;" />
          </div>
          <div v-for="j in 3" :key="j" class="skel-line skel-shimmer" style="width:100%;height:36px;border-radius:10px;margin-top:10px;" />
        </div>
      </div>
      <!-- Skeleton: Upcoming events -->
      <div class="skeleton-card section-entrance" style="--entrance-delay: 0.25s;padding:20px;">
        <div class="skel-header-row">
          <div class="skel-line skel-shimmer" style="width:16px;height:16px;" />
          <div class="skel-line skel-shimmer" style="width:80px;height:16px;" />
          <div class="skel-line skel-shimmer" style="width:28px;height:20px;border-radius:10px;" />
        </div>
        <div v-for="i in 3" :key="'up'+i" class="skel-line skel-shimmer" style="width:100%;height:42px;border-radius:12px;margin-top:10px;" />
      </div>
      <!-- Skeleton: Activity + Quick Actions -->
      <div class="skeleton-card section-entrance" style="--entrance-delay: 0.3s;padding:20px;">
        <div class="skel-header-row">
          <div class="skel-line skel-shimmer" style="width:16px;height:16px;" />
          <div class="skel-line skel-shimmer" style="width:80px;height:16px;" />
          <div class="skel-line skel-shimmer" style="width:28px;height:20px;border-radius:10px;" />
        </div>
        <div v-for="i in 4" :key="'act'+i" class="skel-line skel-shimmer" style="width:100%;height:32px;border-radius:10px;margin-top:8px;" />
      </div>
      <div class="quick-actions section-entrance" style="--entrance-delay: 0.35s;">
        <div v-for="i in 4" :key="'qa'+i" class="skeleton-card qa-skeleton">
          <div class="skel-line skel-shimmer" style="width:28px;height:28px;border-radius:50%;" />
          <div class="skel-line skel-shimmer" style="width:56px;height:12px;margin-top:6px;" />
        </div>
      </div>
    </template>

    <!-- No pet selected -->
    <div v-else-if="!selectedPetId" class="empty-state section-entrance" style="--entrance-delay: 0.1s;">
      <div class="empty-card">
        <span class="empty-emoji bounce-anim">🐾</span>
        <p class="empty-text">请选择一只宠物查看健康概览</p>
        <span class="twinkle-star">✦</span>
        <span class="twinkle-star delay1">✦</span>
        <span class="twinkle-star delay2">✦</span>
      </div>
    </div>

    <!-- Pet Health Dashboard -->
    <template v-else-if="petDetail">
      <!-- Pet info header -->
      <div class="pet-info-card section-entrance" style="--entrance-delay: 0.05s;">
        <div class="pet-avatar-ring" v-if="petDetail.avatarUrl">
          <img :src="petDetail.avatarUrl" :alt="petDetail.name" class="pet-avatar-img" />
        </div>
        <div class="pet-avatar-ring pet-avatar-fallback" v-else>
          <span class="pet-avatar-emoji">{{ petDetail.gender === 'female' ? '♀' : '♂' }}</span>
        </div>
        <div class="pet-info-text">
          <h2 class="pet-name">{{ petDetail.name }}</h2>
          <div class="pet-meta">
            <span v-if="petDetail.speciesLabel" class="meta-tag species-tag">{{ petDetail.speciesLabel }}</span>
            <span v-if="petDetail.breedLabel" class="meta-tag breed-tag">{{ petDetail.breedLabel }}</span>
            <span v-if="computeAge(petDetail.birthday)" class="meta-tag age-tag">🎂 {{ computeAge(petDetail.birthday) }}</span>
            <span v-if="petDetail.gender" class="meta-tag" :class="petDetail.gender === 'female' ? 'gender-f' : 'gender-m'">
              {{ petDetail.gender === 'female' ? '♀ 母' : '♂ 公' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Health Score + Stats -->
      <div class="score-stats-section section-entrance" style="--entrance-delay: 0.1s;">
        <div class="health-score-card">
          <div class="score-ring" :style="{ '--score-color': scoreColor }">
            <svg viewBox="0 0 100 100" class="score-svg">
              <circle cx="50" cy="50" r="42" class="score-bg-ring" />
              <circle cx="50" cy="50" r="42" class="score-fg-ring"
                :style="{ strokeDashoffset: 264 - (264 * healthScore / 100) }" />
            </svg>
            <div class="score-value">{{ healthScore }}</div>
          </div>
          <div class="score-label">健康评分</div>
          <div class="score-status" :style="{ color: scoreColor }">{{ scoreLabel }}</div>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-icon">⚖️</span>
            <span class="stat-val">{{ latestWeight ? latestWeight.weightKg + ' kg' : '--' }}</span>
            <span class="stat-label">最新体重</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📋</span>
            <span class="stat-val">{{ pendingEvents.length }}</span>
            <span class="stat-label">待处理事件</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">💊</span>
            <span class="stat-val">{{ activeMedications.length }}</span>
            <span class="stat-label">进行中药物</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🛁</span>
            <span class="stat-val">{{ bathingRecords.length }}</span>
            <span class="stat-label">美容记录</span>
          </div>
        </div>
      </div>

      <!-- Weight Trend -->
      <div v-if="weightLogs.length > 0" class="weight-section section-entrance" style="--entrance-delay: 0.15s;">
        <div class="section-header">
          <span class="section-icon">📊</span>
          <h3 class="section-title">体重趋势</h3>
          <span class="section-count">{{ weightLogs.length }} 条记录</span>
        </div>
        <div class="chart-container">
          <WeightTrendChart :weightLogs="weightLogs" />
        </div>
      </div>

      <!-- Two-column: Events + Medications -->
      <div class="dual-section section-entrance" style="--entrance-delay: 0.2s;">
        <!-- Health Events -->
        <div class="sub-section events-section">
          <div class="section-header">
            <span class="section-icon">🩺</span>
            <h3 class="section-title">健康事件</h3>
            <span class="section-count">{{ healthEvents.length }}</span>
          </div>
          <div v-if="overdueEvents.length > 0" class="overdue-alert">
            <span class="alert-icon">⚠️</span>
            <span>{{ overdueEvents.length }} 项事件已过期</span>
          </div>
          <div v-if="eventTypeBreakdown.length > 0" class="type-bars">
            <div v-for="t in eventTypeBreakdown" :key="t.label" class="type-bar-row">
              <span class="type-bar-icon">{{ getEventIcon(t.label) }}</span>
              <span class="type-bar-label">{{ t.label }}</span>
              <div class="type-bar-track">
                <div class="type-bar-fill" :style="{ width: (t.count / maxEventTypeCount * 100) + '%' }" />
              </div>
              <span class="type-bar-count">{{ t.count }}</span>
            </div>
          </div>
          <div v-else class="mini-empty">暂无健康事件</div>
          <div class="events-summary">
            <span class="es-item done">✅ {{ completedEvents.length }} 已完成</span>
            <span class="es-item pending">⏳ {{ pendingEvents.length }} 待处理</span>
            <span v-if="overdueEvents.length" class="es-item overdue">🔴 {{ overdueEvents.length }} 已过期</span>
          </div>
        </div>

        <!-- Medications -->
        <div class="sub-section meds-section">
          <div class="section-header">
            <span class="section-icon">💊</span>
            <h3 class="section-title">用药记录</h3>
            <span class="section-count">{{ medicationRecords.length }}</span>
          </div>
          <div v-if="activeMedications.length > 0" class="meds-list">
            <div v-for="m in activeMedications.slice(0, 4)" :key="m.id" class="med-item">
              <span class="med-icon">💊</span>
              <div class="med-info">
                <span class="med-name">{{ m.medicationName }}</span>
                <span class="med-dose">{{ m.dosage }}{{ m.frequency ? ' · ' + m.frequency : '' }}</span>
              </div>
              <span class="med-badge active-badge">进行中</span>
            </div>
          </div>
          <div v-else class="mini-empty">暂无进行中的用药</div>
          <div v-if="medicationRecords.length > activeMedications.length" class="meds-completed-hint">
            另有 {{ medicationRecords.length - activeMedications.length }} 条已完成记录
          </div>
        </div>
      </div>

      <!-- Upcoming Events -->
      <div v-if="upcomingEvents.length > 0" class="upcoming-section section-entrance" style="--entrance-delay: 0.25s;">
        <div class="section-header">
          <span class="section-icon">⏰</span>
          <h3 class="section-title">即将到来</h3>
          <span class="section-count">{{ upcomingEvents.length }}</span>
        </div>
        <div class="upcoming-list">
          <div v-for="e in upcomingEvents" :key="e.id" class="upcoming-item" :class="{ urgent: daysUntil(e.nextDueDate) <= 3 }">
            <span class="upcoming-icon">{{ getEventIcon(e.eventTypeLabel) }}</span>
            <div class="upcoming-info">
              <span class="upcoming-label">{{ e.eventTypeLabel || '健康事件' }}</span>
              <span class="upcoming-date">{{ formatDate(e.nextDueDate) }}</span>
            </div>
            <span class="upcoming-days" :class="{
              'days-urgent': daysUntil(e.nextDueDate) <= 3,
              'days-soon': daysUntil(e.nextDueDate) > 3 && daysUntil(e.nextDueDate) <= 7,
              'days-ok': daysUntil(e.nextDueDate) > 7
            }">
              {{ daysUntil(e.nextDueDate) === 0 ? '今天' : daysUntil(e.nextDueDate) + '天后' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Recent Activities -->
      <div v-if="recentActivities.length > 0" class="activity-section section-entrance" style="--entrance-delay: 0.3s;">
        <div class="section-header">
          <span class="section-icon">📜</span>
          <h3 class="section-title">近期动态</h3>
          <span class="section-count">{{ recentActivities.length }}</span>
        </div>
        <div class="activity-list">
          <div v-for="(a, idx) in recentActivities" :key="idx" class="activity-item" :style="{ '--activity-color': a.color }">
            <span class="activity-dot" />
            <span class="activity-icon">{{ a.icon }}</span>
            <span class="activity-label">{{ a.label }}</span>
            <span class="activity-date">{{ formatDate(a.date) }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions section-entrance" style="--entrance-delay: 0.35s;">
        <button class="qa-btn" @click="navigateTo('health-events')">
          <div class="qa-icon-wrap"><span class="qa-icon">🩺</span></div>
          <span class="qa-label">健康事件</span>
        </button>
        <button class="qa-btn" @click="navigateTo('weight-logs')">
          <div class="qa-icon-wrap"><span class="qa-icon">⚖️</span></div>
          <span class="qa-label">体重管理</span>
        </button>
        <button class="qa-btn" @click="navigateTo('medication')">
          <div class="qa-icon-wrap"><span class="qa-icon">💊</span></div>
          <span class="qa-label">用药记录</span>
        </button>
        <button class="qa-btn" @click="navigateTo('bathing')">
          <div class="qa-icon-wrap"><span class="qa-icon">🛁</span></div>
          <span class="qa-label">洗澡美容</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.health-overview {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}

/* Hero */
.hero-wrapper { margin-bottom: 24px; }

.hero-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid rgba(16, 185, 129, 0.2);
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.12);
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.06), rgba(59, 130, 246, 0.04));
  z-index: 0;
}

.hero-card::before {
  content: '';
  position: absolute;
  inset: 0;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 36px 32px 28px;
  text-align: center;
}

.hero-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 6px;
}

.hero-emoji {
  font-size: 32px;
  animation: gentleBounce 2s ease-in-out infinite;
}

.hero-title {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #10b981, #06b6d4, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.hero-subtitle {
  font-size: 14px;
  color: var(--text-color-3, #9ca3af);
  margin: 0 0 16px;
}

.hero-pet-selector {
  max-width: 320px;
  margin: 0 auto;
}

.pet-selector :deep(.n-base-selection) {
  border-radius: 14px !important;
}

/* Floating decorations */
.float-decor {
  position: absolute;
  font-size: 20px;
  opacity: 0.15;
  z-index: 1;
  animation: floatShape 6s ease-in-out infinite;
}
.d1 { top: 10%; left: 8%; animation-delay: 0s; }
.d2 { top: 15%; right: 10%; animation-delay: 1s; }
.d3 { bottom: 20%; left: 15%; animation-delay: 2s; }
.d4 { bottom: 10%; right: 12%; animation-delay: 0.5s; }
.d5 { top: 50%; left: 5%; animation-delay: 3s; }
.d6 { top: 50%; right: 5%; animation-delay: 1.5s; }

@keyframes floatShape {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(5deg); }
}

@keyframes gentleBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Skeleton shimmer */
.skeleton-card {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.08);
}

.pet-info-skeleton {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  margin-bottom: 20px;
}

.score-skeleton {
  flex-shrink: 0;
  width: 140px;
  padding: 20px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 12px;
}

.chart-skeleton, .sub-skeleton {
  padding: 20px;
  margin-bottom: 20px;
}

.skel-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skel-text-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skel-tags-row {
  display: flex;
  gap: 6px;
}

.qa-skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  gap: 6px;
}

.skel-circle {
  border-radius: 50%;
}

.skel-line {
  border-radius: 6px;
}

.skel-shimmer {
  background: linear-gradient(90deg,
    rgba(16, 185, 129, 0.06) 25%,
    rgba(16, 185, 129, 0.12) 50%,
    rgba(16, 185, 129, 0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Empty state */
.empty-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.empty-card {
  position: relative;
  text-align: center;
  padding: 48px 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 2px dashed rgba(16, 185, 129, 0.2);
}

.empty-emoji {
  font-size: 56px;
  display: block;
  margin-bottom: 12px;
}

.bounce-anim {
  animation: gentleBounce 2s ease-in-out infinite;
}

.empty-text {
  font-size: 15px;
  color: var(--text-color-2, #6b6b6b);
  margin: 0;
}

.twinkle-star {
  position: absolute;
  font-size: 12px;
  opacity: 0.4;
  animation: twinkle 2s ease-in-out infinite;
}
.twinkle-star:nth-child(3) { top: 15%; right: 20%; }
.twinkle-star:nth-child(4) { bottom: 20%; left: 20%; animation-delay: 0.7s; }
.twinkle-star:nth-child(5) { top: 30%; left: 15%; animation-delay: 1.4s; }

@keyframes twinkle {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.3); }
}

/* Pet info card */
.pet-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.12);
  margin-bottom: 20px;
}

.pet-avatar-ring {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, #10b981, #06b6d4, #3b82f6);
  flex-shrink: 0;
}

.pet-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
}

.pet-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: white;
}

.pet-avatar-emoji {
  color: white;
  font-weight: 700;
}

.pet-name {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 6px;
  color: var(--text-color-1, #2d2d2d);
}

.pet-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-tag {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.species-tag { background: rgba(255, 155, 168, 0.12); color: #e8637a; }
.breed-tag { background: rgba(168, 85, 247, 0.1); color: #9333ea; }
.age-tag { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.gender-m { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
.gender-f { background: rgba(236, 72, 153, 0.1); color: #db2777; }

/* Score + Stats */
.score-stats-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.health-score-card {
  flex-shrink: 0;
  width: 140px;
  text-align: center;
  padding: 20px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.12);
}

.score-ring {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 8px;
}

.score-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.score-bg-ring {
  fill: none;
  stroke: rgba(16, 185, 129, 0.1);
  stroke-width: 6;
}

.score-fg-ring {
  fill: none;
  stroke: var(--score-color);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 264;
  transition: stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.score-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text-color-1, #2d2d2d);
}

.score-label {
  font-size: 12px;
  color: var(--text-color-3, #9ca3af);
  margin-bottom: 2px;
}

.score-status {
  font-size: 14px;
  font-weight: 700;
}

.stats-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.08);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.18);
}

.stat-item:hover .stat-icon {
  animation: statIconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes statIconBounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.stat-icon {
  font-size: 20px;
}

.stat-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color-1, #2d2d2d);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 11px;
  color: var(--text-color-3, #9ca3af);
}

/* Weight section */
.weight-section {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-icon {
  font-size: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-color-1, #2d2d2d);
  margin: 0;
}

.section-count {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  font-weight: 600;
}

.chart-container {
  margin-top: 8px;
}

/* Dual section */
.dual-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.sub-section {
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.08);
}

.overdue-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.alert-icon {
  font-size: 16px;
}

/* Type bars */
.type-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.type-bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-bar-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
}

.type-bar-label {
  font-size: 12px;
  color: var(--text-color-2, #6b6b6b);
  width: 60px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-bar-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(16, 185, 129, 0.08);
  overflow: hidden;
}

.type-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #10b981, #06b6d4);
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.type-bar-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-2, #6b6b6b);
  width: 20px;
  text-align: right;
}

.events-summary {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.es-item {
  font-size: 12px;
  font-weight: 600;
}
.es-done { color: #10b981; }
.es-pending { color: #f59e0b; }
.es-overdue { color: #ef4444; }

/* Medications */
.meds-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.med-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(167, 139, 250, 0.06);
  transition: all 0.2s;
}

.med-item:hover {
  background: rgba(167, 139, 250, 0.12);
}

.med-icon {
  font-size: 16px;
}

.med-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.med-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color-1, #2d2d2d);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.med-dose {
  font-size: 11px;
  color: var(--text-color-3, #9ca3af);
}

.med-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
  flex-shrink: 0;
}

.active-badge {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.meds-completed-hint {
  font-size: 12px;
  color: var(--text-color-3, #9ca3af);
  text-align: center;
  padding-top: 4px;
}

.mini-empty {
  text-align: center;
  padding: 20px 0;
  font-size: 13px;
  color: var(--text-color-3, #9ca3af);
}

/* Upcoming */
.upcoming-section {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.08);
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.04);
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.upcoming-item:hover {
  background: rgba(16, 185, 129, 0.08);
  transform: translateX(4px);
}

.upcoming-item.urgent {
  border-left: 3px solid #ef4444;
}

.upcoming-icon {
  font-size: 18px;
}

.upcoming-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.upcoming-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color-1, #2d2d2d);
}

.upcoming-date {
  font-size: 11px;
  color: var(--text-color-3, #9ca3af);
}

.upcoming-days {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 8px;
  flex-shrink: 0;
}

.days-urgent { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
.days-soon { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.days-ok { background: rgba(16, 185, 129, 0.1); color: #059669; }

/* Activity */
.activity-section {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.08);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  transition: all 0.2s;
}

.activity-item:hover {
  background: rgba(16, 185, 129, 0.05);
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--activity-color, #10b981);
  flex-shrink: 0;
}

.activity-icon {
  font-size: 16px;
}

.activity-label {
  flex: 1;
  font-size: 13px;
  color: var(--text-color-2, #6b6b6b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-date {
  font-size: 11px;
  color: var(--text-color-3, #9ca3af);
  flex-shrink: 0;
}

/* Quick actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  position: relative;
}

.quick-actions::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(6, 182, 212, 0.03));
  z-index: 0;
}

.qa-btn {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.1);
  cursor: pointer;
  color: var(--text-color-2, #6b6b6b);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
}

.qa-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  opacity: 0;
  background: radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.12), transparent 70%);
  transition: opacity 0.3s;
}

.qa-btn:hover {
  transform: translateY(-5px) scale(1.03);
  box-shadow: 0 8px 28px rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.2);
  color: var(--text-color-1, #2d2d2d);
}

.qa-btn:hover::after {
  opacity: 1;
}

.qa-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.08);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.06);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.qa-btn:hover .qa-icon-wrap {
  transform: scale(1.1);
  background: rgba(16, 185, 129, 0.14);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.1);
}

.qa-icon {
  font-size: 22px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.qa-btn:hover .qa-icon {
  animation: qaIconPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes qaIconPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.qa-label {
  font-size: 13px;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

/* Section entrance animation */
.section-entrance {
  opacity: 0;
  transform: translateY(16px);
  animation: sectionIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--entrance-delay, 0s);
}

@keyframes sectionIn {
  to { opacity: 1; transform: translateY(0); }
}

/* Dark mode */
:global(.dark-mode) .hero-card {
  border-color: rgba(16, 185, 129, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

:global(.dark-mode) .hero-bg {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.06));
}

:global(.dark-mode) .hero-card::before {
  background: rgba(30, 30, 50, 0.7);
}

:global(.dark-mode) .pet-info-card,
:global(.dark-mode) .health-score-card,
:global(.dark-mode) .stat-item,
:global(.dark-mode) .weight-section,
:global(.dark-mode) .sub-section,
:global(.dark-mode) .upcoming-section,
:global(.dark-mode) .activity-section,
:global(.dark-mode) .qa-btn {
  background: rgba(40, 40, 60, 0.5);
  border-color: rgba(16, 185, 129, 0.1);
}

:global(.dark-mode) .empty-card {
  background: rgba(40, 40, 60, 0.5);
  border-color: rgba(16, 185, 129, 0.15);
}

:global(.dark-mode) .pet-name {
  color: #e5e5e5;
}

:global(.dark-mode) .stat-val {
  color: #e5e5e5;
}

:global(.dark-mode) .score-value {
  color: #e5e5e5;
}

:global(.dark-mode) .section-title {
  color: #e5e5e5;
}

:global(.dark-mode) .med-name {
  color: #e5e5e5;
}

:global(.dark-mode) .upcoming-label {
  color: #e5e5e5;
}

:global(.dark-mode) .score-bg-ring {
  stroke: rgba(16, 185, 129, 0.15);
}

:global(.dark-mode) .med-item {
  background: rgba(167, 139, 250, 0.08);
}

:global(.dark-mode) .med-item:hover {
  background: rgba(167, 139, 250, 0.15);
}

:global(.dark-mode) .type-bar-track {
  background: rgba(16, 185, 129, 0.12);
}

:global(.dark-mode) .upcoming-item {
  background: rgba(16, 185, 129, 0.05);
}

:global(.dark-mode) .upcoming-item:hover {
  background: rgba(16, 185, 129, 0.1);
}

:global(.dark-mode) .activity-item:hover {
  background: rgba(16, 185, 129, 0.08);
}

:global(.dark-mode) .qa-btn {
  background: rgba(40, 40, 60, 0.45);
}

:global(.dark-mode) .qa-btn:hover {
  background: rgba(50, 50, 70, 0.7);
  color: #e5e5e5;
}

:global(.dark-mode) .qa-icon-wrap {
  background: rgba(16, 185, 129, 0.1);
}

:global(.dark-mode) .qa-btn:hover .qa-icon-wrap {
  background: rgba(16, 185, 129, 0.18);
}

:global(.dark-mode) .skeleton-card,
:global(.dark-mode) .score-skeleton,
:global(.dark-mode) .stat-skeleton,
:global(.dark-mode) .chart-skeleton,
:global(.dark-mode) .sub-skeleton,
:global(.dark-mode) .qa-skeleton {
  background: rgba(40, 40, 60, 0.5);
  border-color: rgba(16, 185, 129, 0.1);
}

:global(.dark-mode) .skel-shimmer {
  background: linear-gradient(90deg,
    rgba(16, 185, 129, 0.04) 25%,
    rgba(16, 185, 129, 0.08) 50%,
    rgba(16, 185, 129, 0.04) 75%
  );
  background-size: 200% 100%;
}

:global(.dark-mode) .quick-actions::before {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(6, 182, 212, 0.04));
}

/* Mobile */
@media (max-width: 768px) {
  .health-overview {
    padding: 16px 12px 48px;
  }

  .hero-content {
    padding: 28px 20px 22px;
  }

  .hero-title {
    font-size: 24px;
  }

  .score-stats-section {
    flex-direction: column;
  }

  .health-score-card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
  }

  .score-ring {
    margin: 0;
  }

  .dual-section {
    grid-template-columns: 1fr;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }

  .qa-btn {
    padding: 16px 10px;
  }

  .qa-icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 12px;
  }

  .qa-icon {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 20px;
  }

  .hero-emoji {
    font-size: 26px;
  }

  .pet-info-card, .pet-info-skeleton {
    padding: 14px 16px;
  }

  .pet-avatar-ring {
    width: 44px;
    height: 44px;
  }

  .pet-name {
    font-size: 17px;
  }

  .stat-val {
    font-size: 16px;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .qa-btn {
    padding: 14px 8px;
  }

  .qa-label {
    font-size: 12px;
  }

  .qa-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .qa-icon {
    font-size: 18px;
  }

  .type-bar-label {
    width: 48px;
  }
}
</style>
