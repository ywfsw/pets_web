<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { fetchActivityLog } from '@/api.js';
import PetAvatarSelector from '@/components/PetAvatarSelector.vue';
import { NPagination } from 'naive-ui';

const petStore = usePetStore();

const mounted = ref(false);
onMounted(() => { requestAnimationFrame(() => { mounted.value = true; }); });

const selectedPetId = ref(null);
const selectedType = ref('');
const activities = ref([]);
const stats = ref(null);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(30);
const total = ref(0);

const typeOptions = [
  { value: '', label: '全部', icon: '📋', color: '#6366F1' },
  { value: 'weight', label: '体重', icon: '⚖️', color: '#0EA5E9' },
  { value: 'health', label: '健康', icon: '🩺', color: '#059669' },
  { value: 'feeding', label: '喂养', icon: '🍽️', color: '#D97706' },
  { value: 'photo', label: '相册', icon: '📷', color: '#9333EA' },
  { value: 'medication', label: '用药', icon: '💊', color: '#7C3AED' },
  { value: 'bathing', label: '美容', icon: '🛁', color: '#0891B2' }
];

const loadActivities = async () => {
  loading.value = true;
  try {
    const params = { pageNum: pageNum.value, pageSize: pageSize.value };
    if (selectedPetId.value) params.petId = selectedPetId.value;
    if (selectedType.value) params.type = selectedType.value;
    const res = await fetchActivityLog(params);
    activities.value = res.data.activities || [];
    total.value = res.data.total || 0;
    stats.value = res.data.stats || null;
  } catch (err) {
    console.error('加载活动日志失败:', err);
    activities.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  pageNum.value = page;
  loadActivities();
};

const handleTypeChange = (type) => {
  selectedType.value = type;
  pageNum.value = 1;
  loadActivities();
};

watch(selectedPetId, () => {
  pageNum.value = 1;
  loadActivities();
});

onMounted(async () => {
  if (petStore.petList.length === 0) {
    await petStore.loadPetList();
  }
  loadActivities();
});

// Group activities by date
const groupedActivities = computed(() => {
  const groups = {};
  activities.value.forEach(a => {
    const dateKey = a.date || '未知日期';
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(a);
  });
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
});

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === '未知日期') return '未知日期';
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today - target) / 86400000);
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff === 2) return '前天';
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}年${m}月${day}日`;
};

const timeEmoji = computed(() => {
  const h = new Date().getHours();
  if (h >= 5 && h < 9) return '🌅';
  if (h >= 9 && h < 12) return '☀️';
  if (h >= 12 && h < 14) return '🌤️';
  if (h >= 14 && h < 18) return '🌇';
  if (h >= 18 && h < 21) return '🌆';
  return '🌙';
});

const selectedPetName = computed(() => {
  if (!selectedPetId.value) return null;
  const pet = petStore.petList.find(p => p.id === selectedPetId.value);
  return pet ? pet.name : null;
});
</script>

<template>
  <div class="activity-log" :class="{ mounted }">
    <!-- Hero -->
    <div class="hero-section section-entrance" style="--delay: 0s">
      <div class="hero-border">
        <div class="hero-inner">
          <div class="hero-shapes">
            <span class="hero-shape" style="--x:8%;--y:20%;--d:12s">📋</span>
            <span class="hero-shape" style="--x:85%;--y:15%;--d:10s">🐾</span>
            <span class="hero-shape" style="--x:15%;--y:75%;--d:14s">✨</span>
            <span class="hero-shape" style="--x:75%;--y:70%;--d:11s">📖</span>
            <span class="hero-shape" style="--x:50%;--y:10%;--d:13s">🦋</span>
            <span class="hero-shape" style="--x:92%;--y:50%;--d:9s">🌟</span>
          </div>
          <h1 class="hero-title">
            <span class="hero-title-emoji gentle-bounce">📋</span>
            <span>活动日志</span>
          </h1>
          <p class="hero-subtitle">{{ timeEmoji }} 一站式回顾所有宠物的生活记录</p>
          <div v-if="stats" class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-num">{{ stats.totalActivities }}</span>
              <span class="hero-stat-label">总记录</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-num">{{ stats.weightCount }}</span>
              <span class="hero-stat-label">⚖️ 体重</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-num">{{ stats.healthCount }}</span>
              <span class="hero-stat-label">🩺 健康</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-num">{{ stats.feedingCount }}</span>
              <span class="hero-stat-label">🍽️ 喂养</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-num">{{ stats.photoCount }}</span>
              <span class="hero-stat-label">📷 相册</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-num">{{ stats.medicationCount }}</span>
              <span class="hero-stat-label">💊 用药</span>
            </div>
            <div class="hero-stat">
              <span class="hero-stat-num">{{ stats.bathingCount }}</span>
              <span class="hero-stat-label">🛁 美容</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pet selector -->
    <div v-if="petStore.petList.length > 1" class="pet-selector-section section-entrance" style="--delay: 0.06s">
      <PetAvatarSelector
        :pets="petStore.petList"
        :selected-id="selectedPetId"
        @update:selected-id="(id) => { selectedPetId = id === selectedPetId ? null : id; }"
        show-all
      />
    </div>
    <div v-if="selectedPetName" class="selected-pet-hint section-entrance" style="--delay: 0.08s">
      🐾 当前查看：<strong>{{ selectedPetName }}</strong> 的活动记录
    </div>

    <!-- Type filter -->
    <div class="type-filter section-entrance" style="--delay: 0.1s">
      <button
        v-for="t in typeOptions"
        :key="t.value"
        class="type-pill"
        :class="{ active: selectedType === t.value }"
        :style="selectedType === t.value ? { background: t.color, borderColor: t.color } : {}"
        @click="handleTypeChange(t.value)"
      >
        <span class="type-pill-icon">{{ t.icon }}</span>
        <span class="type-pill-label">{{ t.label }}</span>
        <span v-if="stats && t.value" class="type-pill-count">
          {{ stats[t.value + 'Count'] || 0 }}
        </span>
        <span v-if="stats && !t.value" class="type-pill-count">
          {{ stats.totalActivities }}
        </span>
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="skeleton-container section-entrance" style="--delay: 0.15s">
      <div v-for="i in 5" :key="i" class="skeleton-group">
        <div class="skeleton-date shimmer"></div>
        <div v-for="j in 3" :key="j" class="skeleton-item shimmer">
          <div class="skeleton-icon"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line w60"></div>
            <div class="skeleton-line w40"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="activities.length === 0" class="empty-state section-entrance" style="--delay: 0.15s">
      <div class="empty-icon">📋</div>
      <div class="empty-stars">
        <span class="star" style="--d:0s">✨</span>
        <span class="star" style="--d:0.5s">⭐</span>
        <span class="star" style="--d:1s">✨</span>
      </div>
      <p class="empty-title">暂无活动记录</p>
      <p class="empty-desc">开始为你的宠物记录生活点滴吧！</p>
    </div>

    <!-- Activity timeline -->
    <div v-else class="timeline section-entrance" style="--delay: 0.15s">
      <div v-for="group in groupedActivities" :key="group.date" class="timeline-group">
        <div class="timeline-date">
          <span class="timeline-date-badge">{{ formatDate(group.date) }}</span>
          <span class="timeline-date-count">{{ group.items.length }} 条记录</span>
        </div>
        <div class="timeline-items">
          <div
            v-for="(item, ii) in group.items"
            :key="item.id"
            class="timeline-item item-slide-in"
            :style="{ '--delay': (ii * 0.04) + 's' }"
          >
            <div class="timeline-dot" :style="{ background: item.color }">
              <span class="timeline-dot-icon">{{ item.icon }}</span>
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-title">{{ item.title }}</span>
                <span class="timeline-pet">{{ item.petName }}</span>
              </div>
              <div v-if="item.detail" class="timeline-detail">{{ item.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && total > pageSize" class="pagination-wrap section-entrance" style="--delay: 0.2s">
      <n-pagination
        :page="pageNum"
        :page-size="pageSize"
        :item-count="total"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
/* ── Hero ── */
.hero-section { margin-bottom: 24px; }
.hero-border {
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(135deg, #818CF8, #6366F1, #4F46E5, #4338CA);
  box-shadow: 0 8px 32px rgba(99,102,241,0.18);
}
.hero-inner {
  position: relative; overflow: hidden;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(18px) saturate(1.5);
  border-radius: 18px; padding: 32px 36px;
}
.hero-shapes { position: absolute; inset: 0; pointer-events: none; }
.hero-shape {
  position: absolute; left: var(--x); top: var(--y);
  font-size: 22px; opacity: 0.18;
  animation: heroFloat var(--d) ease-in-out infinite;
}
@keyframes heroFloat { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-12px) rotate(6deg)} }
.hero-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 26px; font-weight: 700; margin: 0;
  background: linear-gradient(135deg, #6366F1, #818CF8, #A78BFA);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-title-emoji { font-size: 32px; -webkit-text-fill-color: initial; }
.gentle-bounce { animation: gentleBounce 2s ease-in-out infinite; }
@keyframes gentleBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
.hero-subtitle { margin: 8px 0 20px; font-size: 14px; color: #6366F1; opacity: 0.8; }
.hero-stats {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.hero-stat {
  display: flex; flex-direction: column; align-items: center;
  background: rgba(99,102,241,0.08); border-radius: 12px;
  padding: 8px 14px; min-width: 70px;
}
.hero-stat-num {
  font-size: 20px; font-weight: 700; color: #4338CA;
  font-variant-numeric: tabular-nums;
}
.hero-stat-label { font-size: 11px; color: #6366F1; opacity: 0.8; white-space: nowrap; }

/* ── Pet selector ── */
.pet-selector-section { margin-bottom: 12px; }
.selected-pet-hint {
  text-align: center; padding: 8px 16px; margin-bottom: 16px;
  font-size: 13px; color: #6366F1;
  background: rgba(99,102,241,0.06); border-radius: 10px;
}
.selected-pet-hint strong { color: #4338CA; }

/* ── Type filter ── */
.type-filter {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin-bottom: 24px; padding: 0 4px;
}
.type-pill {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 14px; border-radius: 20px;
  border: 1.5px solid rgba(99,102,241,0.2);
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  cursor: pointer; font-size: 13px;
  transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
  color: #4B5563;
}
.type-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.15); }
.type-pill.active {
  color: #fff; border-color: transparent;
  box-shadow: 0 4px 16px rgba(99,102,241,0.3);
}
.type-pill-icon { font-size: 15px; }
.type-pill-label { font-weight: 500; }
.type-pill-count {
  background: rgba(0,0,0,0.1); border-radius: 10px;
  padding: 1px 7px; font-size: 11px; font-weight: 600;
}
.type-pill.active .type-pill-count { background: rgba(255,255,255,0.25); }

/* ── Timeline ── */
.timeline { padding: 0 4px; }
.timeline-group { margin-bottom: 28px; }
.timeline-date {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 12px; padding-left: 24px;
}
.timeline-date-badge {
  font-size: 14px; font-weight: 600; color: #4338CA;
  background: rgba(99,102,241,0.08); border-radius: 8px;
  padding: 4px 12px;
}
.timeline-date-count { font-size: 12px; color: #9CA3AF; }
.timeline-items { position: relative; padding-left: 24px; }
.timeline-items::before {
  content: ''; position: absolute; left: 14px; top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, rgba(99,102,241,0.3), rgba(99,102,241,0.05));
  border-radius: 1px;
}
.timeline-item {
  position: relative; display: flex; align-items: flex-start; gap: 14px;
  padding: 12px 16px; margin-bottom: 8px;
  border-radius: 14px;
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.6);
  transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
}
.timeline-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  background: rgba(255,255,255,0.85);
}
.timeline-dot {
  position: absolute; left: -24px; top: 14px;
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1;
}
.timeline-dot-icon { font-size: 13px; }
.timeline-content { flex: 1; min-width: 0; }
.timeline-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.timeline-title { font-size: 14px; font-weight: 600; color: #1F2937; }
.timeline-pet {
  font-size: 12px; color: #6366F1;
  background: rgba(99,102,241,0.08); border-radius: 6px;
  padding: 2px 8px;
}
.timeline-detail {
  margin-top: 4px; font-size: 13px; color: #6B7280;
}

/* ── Item slide-in animation ── */
.item-slide-in {
  animation: itemSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
  animation-delay: var(--delay, 0s);
}
@keyframes itemSlideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ── Skeleton ── */
.skeleton-container { padding: 0 4px; }
.skeleton-group { margin-bottom: 24px; }
.skeleton-date {
  width: 120px; height: 28px; border-radius: 8px;
  margin-bottom: 12px; margin-left: 24px;
}
.skeleton-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; margin-bottom: 8px; margin-left: 24px;
  border-radius: 14px;
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(0,0,0,0.04);
}
.skeleton-icon { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
.skeleton-lines { flex: 1; }
.skeleton-line {
  height: 12px; border-radius: 6px; margin-bottom: 6px;
}
.w60 { width: 60%; }
.w40 { width: 40%; }
.shimmer {
  background: linear-gradient(90deg, rgba(99,102,241,0.06) 25%, rgba(99,102,241,0.12) 50%, rgba(99,102,241,0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Empty state ── */
.empty-state {
  text-align: center; padding: 60px 20px;
  border-radius: 20px;
  background: rgba(255,255,255,0.5);
  border: 2px dashed rgba(99,102,241,0.2);
}
.empty-icon { font-size: 56px; animation: emptyBounce 2s ease-in-out infinite; }
@keyframes emptyBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.empty-stars { margin: 12px 0; }
.star {
  display: inline-block; font-size: 18px;
  animation: twinkle 2s ease-in-out infinite;
  animation-delay: var(--d);
}
@keyframes twinkle { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
.empty-title { font-size: 18px; font-weight: 600; color: #4338CA; margin: 8px 0; }
.empty-desc { font-size: 14px; color: #9CA3AF; }

/* ── Pagination ── */
.pagination-wrap {
  display: flex; justify-content: center;
  margin-top: 24px; padding: 16px 0;
}

/* ── Section entrance ── */
.section-entrance {
  opacity: 0; transform: translateY(14px);
  animation: sectionIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
  animation-delay: var(--delay, 0s);
}
@keyframes sectionIn { to { opacity: 1; transform: translateY(0); } }

/* ── Dark theme ── */
:root.dark .hero-inner { background: rgba(30,27,75,0.9); }
:root.dark .hero-stat { background: rgba(99,102,241,0.15); }
:root.dark .hero-stat-num { color: #A5B4FC; }
:root.dark .hero-stat-label { color: #818CF8; }
:root.dark .hero-subtitle { color: #A5B4FC; }
:root.dark .selected-pet-hint { background: rgba(99,102,241,0.1); color: #A5B4FC; }
:root.dark .selected-pet-hint strong { color: #C7D2FE; }
:root.dark .type-pill {
  background: rgba(30,27,75,0.6); border-color: rgba(99,102,241,0.25);
  color: #C7D2FE;
}
:root.dark .type-pill-count { background: rgba(255,255,255,0.1); }
:root.dark .timeline-item {
  background: rgba(30,27,75,0.6);
  border-color: rgba(99,102,241,0.15);
}
:root.dark .timeline-item:hover { background: rgba(30,27,75,0.8); }
:root.dark .timeline-title { color: #E0E7FF; }
:root.dark .timeline-pet { color: #A5B4FC; background: rgba(99,102,241,0.15); }
:root.dark .timeline-detail { color: #9CA3AF; }
:root.dark .timeline-date-badge { color: #A5B4FC; background: rgba(99,102,241,0.15); }
:root.dark .timeline-date-count { color: #6B7280; }
:root.dark .timeline-items::before { background: linear-gradient(180deg, rgba(99,102,241,0.25), rgba(99,102,241,0.05)); }
:root.dark .skeleton-item { background: rgba(30,27,75,0.5); border-color: rgba(99,102,241,0.1); }
:root.dark .skeleton-date { background: rgba(99,102,241,0.08); }
:root.dark .shimmer { background: linear-gradient(90deg, rgba(99,102,241,0.04) 25%, rgba(99,102,241,0.1) 50%, rgba(99,102,241,0.04) 75%); }
:root.dark .empty-state { background: rgba(30,27,75,0.5); border-color: rgba(99,102,241,0.2); }
:root.dark .empty-title { color: #A5B4FC; }

/* ── Mobile ── */
@media (max-width: 768px) {
  .hero-inner { padding: 24px 20px; }
  .hero-title { font-size: 22px; }
  .hero-title-emoji { font-size: 26px; }
  .hero-stats { gap: 6px; }
  .hero-stat { padding: 6px 10px; min-width: 56px; }
  .hero-stat-num { font-size: 16px; }
  .hero-stat-label { font-size: 10px; }
  .type-filter { gap: 6px; }
  .type-pill { padding: 6px 10px; font-size: 12px; }
  .timeline-items { padding-left: 20px; }
  .timeline-dot { left: -20px; width: 24px; height: 24px; }
  .timeline-dot-icon { font-size: 11px; }
  .timeline-date { padding-left: 20px; }
}
@media (max-width: 480px) {
  .hero-inner { padding: 20px 16px; }
  .hero-title { font-size: 20px; }
  .hero-stats { flex-wrap: wrap; }
  .hero-stat { flex: 1; min-width: 48px; }
  .type-pill-label { display: none; }
  .type-pill { padding: 6px 10px; }
}
</style>
