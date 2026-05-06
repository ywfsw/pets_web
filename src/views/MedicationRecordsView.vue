<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { fetchMedicationRecordsPage, fetchMedicationStats } from '@/api.js';
import {
  NSelect,
  NTag,
  NButton,
  NIcon,
  NPagination,
  NPopconfirm
} from 'naive-ui';
import {
  PawOutline,
  AddOutline,
  CreateOutline,
  TrashOutline
} from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();

const mounted = ref(false);
onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true; });
});

const selectedPetId = ref(null);
const records = ref([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);
const medicationStats = ref(null);
const loadingStats = ref(false);

const typeIcons = {
  '口服药': '💊',
  '外用药': '🩹',
  '注射药': '💉',
  '滴剂': '💧',
  '喷雾': '🌫️',
  '眼药': '👁️',
  '耳药': '👂',
  '保健品': '🌿',
  '中草药': '🍵'
};

const petOptions = computed(() => {
  return [
    { label: '全部宠物', value: null },
    ...petStore.petList.map(pet => ({
      label: pet.name,
      value: pet.id
    }))
  ];
});

const loadRecords = async () => {
  loading.value = true;
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    };
    if (selectedPetId.value) {
      params.petId = selectedPetId.value;
    }
    const res = await fetchMedicationRecordsPage(params);
    records.value = res.data.records || [];
    total.value = res.data.total || 0;
  } catch (err) {
    console.error('加载用药记录失败:', err);
    records.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  loadingStats.value = true;
  try {
    const params = {};
    if (selectedPetId.value) {
      params.petId = selectedPetId.value;
    }
    const res = await fetchMedicationStats(params);
    medicationStats.value = res.data;
  } catch (err) {
    console.error('加载用药统计失败:', err);
    medicationStats.value = null;
  } finally {
    loadingStats.value = false;
  }
};

watch(selectedPetId, () => {
  pageNum.value = 1;
  loadRecords();
  loadStats();
});

onMounted(async () => {
  if (petStore.petList.length === 0) {
    await petStore.loadPetList();
  }
  loadRecords();
  loadStats();
});

const stats = computed(() => {
  if (medicationStats.value) {
    return {
      total: medicationStats.value.totalRecords || 0,
      active: medicationStats.value.activeCount || 0,
      completed: medicationStats.value.completedCount || 0,
      topType: medicationStats.value.topType || '-'
    };
  }
  return { total: 0, active: 0, completed: 0, topType: '-' };
});

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getPetName = (petId) => {
  const pet = petStore.petList.find(p => p.id === petId);
  return pet ? pet.name : '未知宠物';
};

const getTypeIcon = (type) => {
  return typeIcons[type] || '💊';
};

const isActive = (record) => {
  const today = new Date().toISOString().slice(0, 10);
  const start = record.startDate;
  const end = record.endDate;
  if (!start) return false;
  const startStr = typeof start === 'string' ? start : new Date(start).toISOString().slice(0, 10);
  if (startStr > today) return false;
  if (!end) return true;
  const endStr = typeof end === 'string' ? end : new Date(end).toISOString().slice(0, 10);
  return endStr >= today;
};

const handlePageChange = (page) => {
  pageNum.value = page;
  loadRecords();
};

const handleAdd = () => {
  if (!authStore.isAuthenticated) {
    window.$message.warning('请先登录后再添加记录');
    return;
  }
  if (selectedPetId.value) {
    petStore.showMedicationRecordFormModal(selectedPetId.value);
  } else if (petStore.petList.length === 1) {
    petStore.showMedicationRecordFormModal(petStore.petList[0].id);
  } else {
    window.$message.info('请先选择一只宠物');
  }
};

const handleEdit = (record) => {
  if (!authStore.isAuthenticated) {
    window.$message.warning('请先登录后再编辑');
    return;
  }
  petStore.showMedicationRecordFormModal(record.petId, record);
};

const handleDelete = async (record) => {
  try {
    await petStore.handleDeleteMedicationRecord(record.id);
    window.$message.success('记录已删除');
    loadRecords();
    loadStats();
  } catch {
    window.$message.error('删除失败，请重试');
  }
};

watch(() => petStore.medicationRecordFormModal.show, (show) => {
  if (!show) {
    loadRecords();
    loadStats();
  }
});
</script>

<template>
  <div class="medication-records-page" :class="{ 'is-mounted': mounted }">
    <!-- Immersive Hero -->
    <div class="med-hero">
      <div class="hero-gradient-frame">
        <div class="hero-inner">
          <div class="hero-decorations">
            <span class="hero-shape shape-1">💊</span>
            <span class="hero-shape shape-2">🐾</span>
            <span class="hero-shape shape-3">✨</span>
            <span class="hero-shape shape-4">💉</span>
            <span class="hero-shape shape-5">🩺</span>
            <span class="hero-shape shape-6">🌿</span>
          </div>
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="hero-title-icon">💊</span>
              <span class="hero-title-text">用药记录</span>
            </h1>
            <p class="hero-subtitle">记录每一次用药，守护毛孩子的健康</p>
          </div>
          <div class="hero-stats-bar">
            <div class="hero-stat">
              <span class="hero-stat-icon">📊</span>
              <span class="hero-stat-value">{{ stats.total }}</span>
              <span class="hero-stat-label">总记录</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">🟢</span>
              <span class="hero-stat-value">{{ stats.active }}</span>
              <span class="hero-stat-label">进行中</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">✅</span>
              <span class="hero-stat-value">{{ stats.completed }}</span>
              <span class="hero-stat-label">已完成</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">⭐</span>
              <span class="hero-stat-value hero-stat-value-text">{{ stats.topType }}</span>
              <span class="hero-stat-label">最常用药</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar section-entrance" style="--entrance-delay: 0.1s;">
      <n-select
        v-model:value="selectedPetId"
        :options="petOptions"
        placeholder="选择宠物筛选"
        clearable
        filterable
        size="medium"
        class="pet-selector"
      >
        <template #prefix>
          <n-icon :component="PawOutline" size="16" />
        </template>
      </n-select>
      <n-button
        type="primary"
        class="add-btn"
        @click="handleAdd"
        :disabled="!authStore.isAuthenticated || petStore.petList.length === 0"
      >
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        添加记录
      </n-button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="skeleton-list section-entrance" style="--entrance-delay: 0.15s;">
      <div v-for="i in 5" :key="i" class="skeleton-record">
        <div class="skeleton-icon-circle" />
        <div class="skeleton-lines">
          <div class="skeleton-line skeleton-line-title" />
          <div class="skeleton-line skeleton-line-sub" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="records.length === 0" class="empty-state section-entrance" style="--entrance-delay: 0.15s;">
      <div class="empty-icon-wrap">
        <span class="empty-icon-emoji">💊</span>
        <span class="empty-icon-sparkle">✨</span>
      </div>
      <div class="empty-title">还没有用药记录</div>
      <div class="empty-desc">记录每次用药详情，保障宠物用药安全</div>
      <n-button
        v-if="authStore.isAuthenticated && petStore.petList.length > 0"
        type="primary"
        class="add-btn"
        size="medium"
        @click="handleAdd"
      >
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        添加第一条记录
      </n-button>
    </div>

    <!-- Records List -->
    <div v-else class="records-list section-entrance" style="--entrance-delay: 0.15s;">
      <div
        v-for="(record, idx) in records"
        :key="record.id"
        class="record-item"
        :class="{ 'record-active': isActive(record) }"
        :style="{ '--item-delay': `${Math.min(idx * 0.04, 0.5)}s` }"
      >
        <div class="record-accent" />
        <div class="record-left">
          <div class="record-icon-wrap">
            <span class="record-icon">{{ getTypeIcon(record.medicationType) }}</span>
          </div>
          <div class="record-info">
            <div class="record-main">
              <span class="record-name">{{ record.medicationName || '未命名' }}</span>
              <n-tag v-if="isActive(record)" size="tiny" round class="status-active">进行中</n-tag>
              <n-tag v-else-if="record.endDate" size="tiny" round class="status-completed">已完成</n-tag>
              <n-tag v-if="!selectedPetId" size="small" round type="info" class="pet-tag">
                🐾 {{ getPetName(record.petId) }}
              </n-tag>
            </div>
            <div class="record-meta">
              <span v-if="record.medicationType" class="record-type-chip">{{ record.medicationType }}</span>
              <span v-if="record.dosage" class="record-dosage">💊 {{ record.dosage }}</span>
              <span v-if="record.frequency" class="record-freq">🔄 {{ record.frequency }}</span>
            </div>
            <div class="record-date-row">
              <span class="record-date">📅 {{ formatDate(record.startDate) }}</span>
              <span v-if="record.endDate" class="record-end-date">→ {{ formatDate(record.endDate) }}</span>
            </div>
            <div v-if="record.notes" class="record-notes">📝 {{ record.notes }}</div>
          </div>
        </div>
        <div class="record-actions" v-if="authStore.isAuthenticated">
          <n-button
            text
            size="small"
            type="primary"
            class="action-btn"
            @click="handleEdit(record)"
          >
            <template #icon>
              <n-icon :component="CreateOutline" size="16" />
            </template>
          </n-button>
          <n-popconfirm @positive-click="handleDelete(record)">
            <template #trigger>
              <n-button text size="small" type="error" class="action-btn">
                <template #icon>
                  <n-icon :component="TrashOutline" size="16" />
                </template>
              </n-button>
            </template>
            确定删除这条用药记录吗？
          </n-popconfirm>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="total > pageSize" class="pagination-wrapper">
        <n-pagination
          v-model:page="pageNum"
          :page-size="pageSize"
          :item-count="total"
          @update:page="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.medication-records-page {
  max-width: 800px;
  margin: 0 auto;
}

/* ===== Hero Section ===== */
.med-hero {
  margin-bottom: 24px;
}

.hero-gradient-frame {
  border-radius: 24px;
  padding: 3px;
  background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 30%, #A78BFA 60%, #C4B5FD 100%);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
}

.hero-inner {
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 240, 255, 0.92) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 36px 32px 28px;
  position: relative;
  overflow: hidden;
}

:global(.dark-mode) .hero-gradient-frame {
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.12);
}

:global(.dark-mode) .hero-inner {
  background: linear-gradient(135deg, rgba(30, 25, 45, 0.95) 0%, rgba(35, 30, 50, 0.92) 100%);
}

/* Floating decorations */
.hero-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-shape {
  position: absolute;
  font-size: 20px;
  opacity: 0.35;
  animation: hero-float 6s ease-in-out infinite;
}

:global(.dark-mode) .hero-shape {
  opacity: 0.25;
}

.shape-1 { top: 12%; left: 8%; animation-delay: 0s; font-size: 22px; }
.shape-2 { top: 20%; right: 12%; animation-delay: 1.2s; }
.shape-3 { bottom: 25%; left: 18%; animation-delay: 2.4s; font-size: 16px; }
.shape-4 { top: 15%; right: 30%; animation-delay: 0.8s; font-size: 18px; }
.shape-5 { bottom: 20%; right: 8%; animation-delay: 3s; }
.shape-6 { bottom: 30%; left: 35%; animation-delay: 1.8s; font-size: 16px; }

@keyframes hero-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(5deg); }
  50% { transform: translateY(-14px) rotate(-3deg); }
  75% { transform: translateY(-6px) rotate(2deg); }
}

.hero-content {
  text-align: center;
  position: relative;
  z-index: 1;
  margin-bottom: 24px;
}

.hero-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #A78BFA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:global(.dark-mode) .hero-title {
  background: linear-gradient(135deg, #A78BFA 0%, #C4B5FD 50%, #DDD6FE 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hero-title-icon {
  font-size: 36px;
  -webkit-text-fill-color: initial;
  animation: gentle-bounce 3s ease-in-out infinite;
}

@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.hero-subtitle {
  margin: 0;
  font-size: 15px;
  color: #6B5B95;
  font-weight: 500;
}

:global(.dark-mode) .hero-subtitle {
  color: #C4B5FD;
}

/* Hero Stats Bar */
.hero-stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.15);
  position: relative;
  z-index: 1;
}

:global(.dark-mode) .hero-stats-bar {
  background: rgba(30, 25, 45, 0.5);
  border-color: rgba(139, 92, 246, 0.1);
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hero-stat-icon {
  font-size: 16px;
}

.hero-stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #7C3AED;
  line-height: 1;
}

.hero-stat-value small {
  font-size: 13px;
  font-weight: 600;
}

.hero-stat-value-text {
  font-size: 15px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark-mode) .hero-stat-value {
  color: #A78BFA;
}

.hero-stat-label {
  font-size: 12px;
  color: #6B5B95;
  font-weight: 500;
}

:global(.dark-mode) .hero-stat-label {
  color: #C4B5FD;
}

.hero-stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(139, 92, 246, 0.15);
}

:global(.dark-mode) .hero-stat-divider {
  background: rgba(167, 139, 250, 0.15);
}

/* ===== Section Entrance Animation ===== */
.section-entrance {
  opacity: 0;
  transform: translateY(20px);
}

.is-mounted .section-entrance {
  animation: section-rise 0.5s ease forwards;
  animation-delay: var(--entrance-delay, 0s);
}

@keyframes section-rise {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Toolbar ===== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.pet-selector {
  width: 220px;
}

.add-btn {
  background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

/* ===== Skeleton Loading ===== */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-record {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--pet-card, #FFFFFF);
  border-radius: 14px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

:global(.dark-mode) .skeleton-record {
  background: #2A2A45;
}

.skeleton-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

:global(.dark-mode) .skeleton-icon-circle {
  background: linear-gradient(90deg, #3D3D5C 25%, #4A4A6A 50%, #3D3D5C 75%);
  background-size: 200% 100%;
}

.skeleton-lines {
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
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

:global(.dark-mode) .skeleton-line {
  background: linear-gradient(90deg, #3D3D5C 25%, #4A4A6A 50%, #3D3D5C 75%);
  background-size: 200% 100%;
}

.skeleton-line-title { width: 50%; }
.skeleton-line-sub { width: 75%; }

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ===== Empty State ===== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--pet-card, #FFFFFF);
  border-radius: 20px;
  border: 2px dashed var(--pet-border, #E8DCF0);
}

:global(.dark-mode) .empty-state {
  background: #2A2A45;
  border-color: #3D3D5C;
}

.empty-icon-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.empty-icon-emoji {
  font-size: 56px;
  display: block;
  animation: empty-bounce 2s ease-in-out infinite;
}

.empty-icon-sparkle {
  position: absolute;
  top: -8px;
  right: -12px;
  font-size: 20px;
  animation: sparkle-twinkle 1.5s ease-in-out infinite;
}

@keyframes empty-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes sparkle-twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: #2D2D2D;
  margin-bottom: 8px;
}

:global(.dark-mode) .empty-title {
  color: #E8E8E8;
}

.empty-desc {
  font-size: 14px;
  color: #9CA3AF;
  margin-bottom: 20px;
}

:global(.dark-mode) .empty-desc {
  color: #8888A0;
}

/* ===== Records List ===== */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
  background: var(--pet-card, #FFFFFF);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
  overflow: hidden;
  position: relative;
  opacity: 0;
  transform: translateX(-12px);
  animation: record-enter 0.4s ease forwards;
  animation-delay: var(--item-delay, 0s);
}

:global(.dark-mode) .record-item {
  background: #2A2A45;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@keyframes record-enter {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.record-item:hover {
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.12);
  transform: translateX(3px);
}

:global(.dark-mode) .record-item:hover {
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.08);
}

.record-active {
  border-left: 3px solid #22C55E;
}

.record-accent {
  width: 4px;
  align-self: stretch;
  background: linear-gradient(180deg, #7C3AED 0%, #A78BFA 100%);
  border-radius: 4px 0 0 4px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.25s ease;
}

.record-active .record-accent {
  background: linear-gradient(180deg, #22C55E 0%, #4ADE80 100%);
}

.record-item:hover .record-accent {
  opacity: 1;
}

.record-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
  flex: 1;
  padding: 14px 16px 14px 14px;
}

.record-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

:global(.dark-mode) .record-icon-wrap {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(167, 139, 250, 0.1) 100%);
}

.record-item:hover .record-icon-wrap {
  transform: scale(1.08);
}

.record-icon {
  font-size: 22px;
  line-height: 1;
}

.record-info {
  min-width: 0;
}

.record-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.record-name {
  font-size: 15px;
  font-weight: 600;
  color: #2D2D2D;
}

:global(.dark-mode) .record-name {
  color: #E8E8E8;
}

.status-active {
  background: rgba(34, 197, 94, 0.12) !important;
  color: #16A34A !important;
  border: 1px solid rgba(34, 197, 94, 0.2) !important;
  font-weight: 600;
}

:global(.dark-mode) .status-active {
  background: rgba(34, 197, 94, 0.15) !important;
  color: #4ADE80 !important;
}

.status-completed {
  background: rgba(156, 163, 175, 0.1) !important;
  color: #6B7280 !important;
  border: 1px solid rgba(156, 163, 175, 0.2) !important;
}

:global(.dark-mode) .status-completed {
  background: rgba(156, 163, 175, 0.1) !important;
  color: #9CA3AF !important;
}

.pet-tag {
  font-size: 12px !important;
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.record-type-chip {
  font-size: 11px;
  color: #7C3AED;
  background: rgba(139, 92, 246, 0.08);
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 500;
}

:global(.dark-mode) .record-type-chip {
  color: #A78BFA;
  background: rgba(139, 92, 246, 0.12);
}

.record-dosage,
.record-freq {
  font-size: 12px;
  color: #6B7280;
}

:global(.dark-mode) .record-dosage,
:global(.dark-mode) .record-freq {
  color: #9CA3AF;
}

.record-date-row {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

:global(.dark-mode) .record-date-row {
  color: #9CA3AF;
}

.record-date {
  color: #6B5B95;
}

:global(.dark-mode) .record-date {
  color: #C4B5FD;
}

.record-end-date {
  color: #9CA3AF;
  margin-left: 2px;
}

.record-notes {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark-mode) .record-notes {
  color: #8888A0;
}

.record-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  padding-right: 12px;
  padding-top: 14px;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.record-item:hover .record-actions {
  opacity: 1;
}

.action-btn {
  border-radius: 8px;
}

/* ===== Pagination ===== */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .hero-inner {
    padding: 28px 20px 20px;
  }

  .hero-title {
    font-size: 26px;
  }

  .hero-title-icon {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 13px;
  }

  .hero-stats-bar {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 16px;
  }

  .hero-stat-divider {
    display: none;
  }

  .hero-stat {
    gap: 5px;
  }

  .hero-stat-value {
    font-size: 18px;
  }

  .hero-stat-value-text {
    font-size: 14px;
    max-width: 70px;
  }

  .hero-stat-label {
    font-size: 11px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .pet-selector {
    width: 100%;
  }

  .add-btn {
    width: 100%;
  }

  .record-left {
    padding: 12px 10px 12px 10px;
    gap: 10px;
  }

  .record-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .record-icon {
    font-size: 18px;
  }

  .record-name {
    font-size: 14px;
  }

  .record-actions {
    padding-right: 8px;
  }

  .empty-icon-emoji {
    font-size: 44px;
  }
}

@media (max-width: 480px) {
  .hero-inner {
    padding: 22px 16px 18px;
  }

  .hero-title {
    font-size: 22px;
    gap: 8px;
  }

  .hero-title-icon {
    font-size: 24px;
  }

  .hero-stats-bar {
    gap: 8px;
    padding: 10px 12px;
  }

  .hero-stat-value {
    font-size: 16px;
  }
}
</style>
