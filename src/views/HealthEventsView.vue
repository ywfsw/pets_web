<script setup>
import { ref, watch, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { fetchHealthEventsPage, fetchHealthEventsStats, deleteHealthEvent, completeHealthEvent, uncompleteHealthEvent } from '@/api.js';
import { getEventTypeIcon } from '@/utils/eventTypeIcon.js';
import HealthEventTypeChart from '@/components/HealthEventTypeChart.vue';
import PetAvatarSelector from '@/components/PetAvatarSelector.vue';
import {
  NTag,
  NButton,
  NIcon,
  NPagination,
  NPopconfirm
} from 'naive-ui';
import {
  AddOutline,
  CreateOutline,
  TrashOutline,
  CheckmarkCircleOutline,
  ArrowUndoOutline
} from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();
const dictStore = useDictionaryStore();

const mounted = ref(false);
onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true; });
});

// State
const selectedPetId = ref(petStore.getPageSelectedPet('health-events'));
const statusFilter = ref(null); // null=all, 0=pending, 1=completed
const records = ref([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);

// Stats state
const stats = ref({ totalCount: 0, pendingCount: 0, completedCount: 0, overdueCount: 0, typeBreakdown: [] });
const statsLoading = ref(false);

// Status tab options
const statusOptions = [
  { label: '全部', value: null },
  { label: '待处理', value: 0 },
  { label: '已完成', value: 1 }
];

// Get event type label from store or record
const getEventTypeName = (record) => {
  if (record.eventTypeLabel) return record.eventTypeLabel;
  const item = dictStore.healthEvents.find(d => d.id === record.eventTypeId);
  return item ? item.itemLabel : '未知事件';
};

// Load health events
const loadEvents = async () => {
  loading.value = true;
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    };
    if (selectedPetId.value) {
      params.petId = selectedPetId.value;
    }
    if (statusFilter.value !== null) {
      params.status = statusFilter.value;
    }
    const res = await fetchHealthEventsPage(params);
    records.value = res.data.records || [];
    total.value = res.data.total || 0;
  } catch (err) {
    console.error('加载健康事件失败:', err);
    records.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// Load health events stats
const loadStats = async () => {
  statsLoading.value = true;
  try {
    const params = {};
    if (selectedPetId.value) {
      params.petId = selectedPetId.value;
    }
    const res = await fetchHealthEventsStats(params);
    stats.value = res.data || { totalCount: 0, pendingCount: 0, completedCount: 0, overdueCount: 0, typeBreakdown: [] };
  } catch (err) {
    console.error('加载健康事件统计失败:', err);
  } finally {
    statsLoading.value = false;
  }
};

// Watch filters
watch(selectedPetId, (val) => {
  petStore.setPageSelectedPet('health-events', val);
  pageNum.value = 1;
  loadEvents();
  loadStats();
});

watch(statusFilter, () => {
  pageNum.value = 1;
  loadEvents();
});

// Pre-select from store
onMounted(async () => {
  if (petStore.petList.length === 0) {
    await petStore.loadPetList();
  }
  loadEvents();
  loadStats();
});

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Days until due
const getDaysInfo = (nextDueDate) => {
  if (!nextDueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `已过期 ${Math.abs(diff)} 天`, type: 'error' };
  if (diff === 0) return { text: '今日到期', type: 'warning' };
  if (diff <= 7) return { text: `${diff} 天后到期`, type: 'warning' };
  return { text: `${diff} 天后到期`, type: 'success' };
};

// Page change
const handlePageChange = (page) => {
  pageNum.value = page;
  loadEvents();
};

// Add new event
const handleAdd = () => {
  if (!authStore.isAuthenticated) {
    window.$message.warning('请先登录后再添加健康事件');
    return;
  }
  if (selectedPetId.value) {
    petStore.showHealthEventFormModal(selectedPetId.value);
  } else if (petStore.petList.length === 1) {
    petStore.showHealthEventFormModal(petStore.petList[0].id);
  } else {
    window.$message.info('请先选择一只宠物');
  }
};

// Edit event
const handleEdit = (event) => {
  if (!authStore.isAuthenticated) {
    window.$message.warning('请先登录后再编辑');
    return;
  }
  petStore.showHealthEventFormModal(event.petId, event);
};

// Delete event
const handleDelete = async (event) => {
  try {
    await deleteHealthEvent(event.id);
    window.$message.success('健康事件已删除');
    petStore.loadUpcomingEvents();
    loadEvents();
    loadStats();
  } catch {
    window.$message.error('删除失败，请重试');
  }
};

// Complete event
const handleComplete = async (event) => {
  try {
    await completeHealthEvent(event.id);
    window.$message.success('事件已标记为完成');
    petStore.loadUpcomingEvents();
    loadEvents();
    loadStats();
  } catch {
    window.$message.error('操作失败，请重试');
  }
};

// Uncomplete event
const handleUncomplete = async (event) => {
  try {
    await uncompleteHealthEvent(event.id);
    window.$message.success('事件已恢复为待处理');
    petStore.loadUpcomingEvents();
    loadEvents();
    loadStats();
  } catch {
    window.$message.error('操作失败，请重试');
  }
};

// Watch for modal close to refresh
watch(() => petStore.healthEventFormModal.show, (show) => {
  if (!show) {
    loadEvents();
    loadStats();
  }
});
</script>

<template>
  <div class="health-events-page" :class="{ 'is-mounted': mounted }">
    <!-- Immersive Hero -->
    <div class="health-hero">
      <div class="hero-gradient-frame">
        <div class="hero-inner">
          <div class="hero-decorations">
            <span class="hero-shape shape-1">🩺</span>
            <span class="hero-shape shape-2">💉</span>
            <span class="hero-shape shape-3">✨</span>
            <span class="hero-shape shape-4">🩹</span>
            <span class="hero-shape shape-5">💊</span>
            <span class="hero-shape shape-6">🏥</span>
          </div>
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="hero-title-icon">🩺</span>
              <span class="hero-title-text">健康事件</span>
            </h1>
            <p class="hero-subtitle">疫苗、驱虫、体检，守护宠物的每一天</p>
          </div>
          <div class="hero-stats-bar">
            <div class="hero-stat">
              <span class="hero-stat-icon">📋</span>
              <span class="hero-stat-value">{{ stats.totalCount }}</span>
              <span class="hero-stat-label">总事件</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">⏳</span>
              <span class="hero-stat-value">{{ stats.pendingCount }}</span>
              <span class="hero-stat-label">待处理</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">✅</span>
              <span class="hero-stat-value hero-stat-value-completed">{{ stats.completedCount }}</span>
              <span class="hero-stat-label">已完成</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">⚠️</span>
              <span class="hero-stat-value hero-stat-value-overdue">{{ stats.overdueCount }}</span>
              <span class="hero-stat-label">已过期</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pet Avatar Selector -->
    <div class="pet-selector-section section-entrance" style="--entrance-delay: 0.08s;">
      <PetAvatarSelector
        :pets="petStore.petList"
        :selected-id="selectedPetId"
        :show-all="petStore.petList.length >= 2"
        all-label="全部宠物"
        @select="selectedPetId = $event"
      />
    </div>

    <!-- Toolbar: Status Tabs + Add -->
    <div class="toolbar section-entrance" style="--entrance-delay: 0.1s;">
      <div class="toolbar-left">
        <span v-if="selectedPetId" class="selected-pet-hint">
          🐾 {{ petStore.petList.find(p => p.id === selectedPetId)?.name || '已选宠物' }}
        </span>
        <span v-else class="selected-pet-hint all-pets-hint">
          🐾 全部宠物
        </span>
      </div>
      <div class="toolbar-right">
        <div class="status-tabs">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            class="status-tab"
            :class="{ active: statusFilter === opt.value }"
            @click="statusFilter = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
        <n-button
          type="primary"
          class="add-btn"
          @click="handleAdd"
          :disabled="!authStore.isAuthenticated || petStore.petList.length === 0"
        >
          <template #icon>
            <n-icon :component="AddOutline" />
          </template>
          添加事件
        </n-button>
      </div>
    </div>

    <!-- Event Type Chart -->
    <div class="type-chart-section section-entrance" style="--entrance-delay: 0.15s;">
      <HealthEventTypeChart :stats="stats" />
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="skeleton-list section-entrance" style="--entrance-delay: 0.25s;">
      <div v-for="i in 5" :key="i" class="skeleton-record">
        <div class="skeleton-icon-circle" />
        <div class="skeleton-lines">
          <div class="skeleton-line skeleton-line-title" />
          <div class="skeleton-line skeleton-line-sub" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="records.length === 0" class="empty-state section-entrance" style="--entrance-delay: 0.2s;">
      <div class="empty-icon-wrap">
        <span class="empty-icon-emoji">🩺</span>
        <span class="empty-icon-sparkle">✨</span>
      </div>
      <div class="empty-title">还没有健康事件</div>
      <div class="empty-desc">记录疫苗、驱虫、体检，守护宠物健康每一天</div>
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
        添加第一条事件
      </n-button>
    </div>

    <!-- Events List -->
    <div v-else class="events-list section-entrance" style="--entrance-delay: 0.25s;">
      <div
        v-for="(event, idx) in records"
        :key="event.id"
        class="event-item"
        :class="{ 'event-completed': event.status === 1, 'event-overdue': getDaysInfo(event.nextDueDate)?.type === 'error' && event.status !== 1 }"
        :style="{ '--item-delay': `${Math.min(idx * 0.04, 0.5)}s` }"
      >
        <div class="event-accent" :class="{ 'accent-completed': event.status === 1, 'accent-overdue': getDaysInfo(event.nextDueDate)?.type === 'error' && event.status !== 1 }" />
        <div class="event-left">
          <div class="event-icon-wrap">
            <span class="event-icon">{{ getEventTypeIcon(getEventTypeName(event)) }}</span>
          </div>
          <div class="event-info">
            <div class="event-main">
              <span class="event-type-name">{{ getEventTypeName(event) }}</span>
              <n-tag v-if="event.status === 1" size="small" round type="success">
                ✓ 已完成
              </n-tag>
              <n-tag v-else-if="event.status === 0 || event.status == null" size="small" round type="warning">
                待处理
              </n-tag>
              <n-tag v-if="!selectedPetId && event.petName" size="small" round type="info">
                🐾 {{ event.petName }}
              </n-tag>
            </div>
            <div class="event-meta">
              <span class="event-date">📅 {{ formatDate(event.eventDate) }}</span>
              <span v-if="event.nextDueDate" class="event-due">
                · 下次: {{ formatDate(event.nextDueDate) }}
                <n-tag
                  v-if="getDaysInfo(event.nextDueDate) && event.status !== 1"
                  :type="getDaysInfo(event.nextDueDate).type"
                  size="tiny"
                  round
                  style="margin-left: 4px;"
                >
                  {{ getDaysInfo(event.nextDueDate).text }}
                </n-tag>
              </span>
              <span v-if="event.notes" class="event-notes">· {{ event.notes }}</span>
            </div>
          </div>
        </div>
        <div class="event-actions" v-if="authStore.isAuthenticated">
          <n-popconfirm v-if="event.status === 1" @positive-click="handleUncomplete(event)">
            <template #trigger>
              <n-button text size="small" type="warning" class="action-btn" title="撤销完成">
                <template #icon>
                  <n-icon :component="ArrowUndoOutline" size="16" />
                </template>
              </n-button>
            </template>
            确定将此事件恢复为待处理状态吗？
          </n-popconfirm>
          <n-popconfirm v-else @positive-click="handleComplete(event)">
            <template #trigger>
              <n-button text size="small" type="success" class="action-btn" title="标记完成">
                <template #icon>
                  <n-icon :component="CheckmarkCircleOutline" size="16" />
                </template>
              </n-button>
            </template>
            确定将此事件标记为已完成吗？
          </n-popconfirm>
          <n-button
            text
            size="small"
            type="primary"
            class="action-btn"
            @click="handleEdit(event)"
          >
            <template #icon>
              <n-icon :component="CreateOutline" size="16" />
            </template>
          </n-button>
          <n-popconfirm @positive-click="handleDelete(event)">
            <template #trigger>
              <n-button text size="small" type="error" class="action-btn">
                <template #icon>
                  <n-icon :component="TrashOutline" size="16" />
                </template>
              </n-button>
            </template>
            确定删除这条健康事件吗？
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
.health-events-page {
  max-width: 800px;
  margin: 0 auto;
}

/* ===== Hero Section ===== */
.health-hero {
  margin-bottom: 24px;
}

.hero-gradient-frame {
  border-radius: 24px;
  padding: 3px;
  background: linear-gradient(135deg, #059669 0%, #10B981 30%, #34D399 60%, #6EE7B7 100%);
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.2);
}

.hero-inner {
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(236, 253, 245, 0.92) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 36px 32px 28px;
  position: relative;
  overflow: hidden;
}

:global(.dark-mode) .hero-gradient-frame {
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.12);
}

:global(.dark-mode) .hero-inner {
  background: linear-gradient(135deg, rgba(30, 40, 35, 0.95) 0%, rgba(25, 45, 35, 0.92) 100%);
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
  background: linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:global(.dark-mode) .hero-title {
  background: linear-gradient(135deg, #34D399 0%, #6EE7B7 50%, #A7F3D0 100%);
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
  color: #065F46;
  font-weight: 500;
}

:global(.dark-mode) .hero-subtitle {
  color: #6EE7B7;
}

/* Hero Stats Bar */
.hero-stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(16, 185, 129, 0.15);
  position: relative;
  z-index: 1;
}

:global(.dark-mode) .hero-stats-bar {
  background: rgba(30, 50, 40, 0.5);
  border-color: rgba(16, 185, 129, 0.1);
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-stat-icon {
  font-size: 18px;
}

.hero-stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #047857;
  line-height: 1;
}

:global(.dark-mode) .hero-stat-value {
  color: #34D399;
}

.hero-stat-value-completed {
  color: #059669;
}

:global(.dark-mode) .hero-stat-value-completed {
  color: #6EE7B7;
}

.hero-stat-value-overdue {
  color: #DC2626;
}

:global(.dark-mode) .hero-stat-value-overdue {
  color: #FCA5A5;
}

.hero-stat-label {
  font-size: 12px;
  color: #065F46;
  font-weight: 500;
}

:global(.dark-mode) .hero-stat-label {
  color: #6EE7B7;
}

.hero-stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(16, 185, 129, 0.15);
}

:global(.dark-mode) .hero-stat-divider {
  background: rgba(52, 211, 153, 0.15);
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

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ===== Pet Avatar Selector ===== */
.pet-selector-section {
  margin-bottom: 16px;
}

.selected-pet-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #059669;
  background: rgba(16, 185, 129, 0.08);
  padding: 4px 14px;
  border-radius: 12px;
}

.all-pets-hint {
  color: #6B7280;
  background: rgba(107, 114, 128, 0.08);
}

:global(.dark-mode) .selected-pet-hint {
  color: #34D399;
  background: rgba(16, 185, 129, 0.12);
}

:global(.dark-mode) .all-pets-hint {
  color: #9CA3AF;
  background: rgba(156, 163, 175, 0.1);
}

.status-tabs {
  display: flex;
  gap: 6px;
}

.status-tab {
  padding: 7px 16px;
  border-radius: 20px;
  border: 1.5px solid #E5E7EB;
  background: #FFFFFF;
  color: #6B7280;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.status-tab:hover {
  border-color: #10B981;
  color: #10B981;
}

.status-tab.active {
  background: linear-gradient(135deg, #059669 0%, #10B981 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

:global(.dark-mode) .status-tab {
  background: #1E2A24;
  border-color: #2D4A3A;
  color: #88A8A0;
}

:global(.dark-mode) .status-tab:hover {
  border-color: #10B981;
  color: #34D399;
}

:global(.dark-mode) .status-tab.active {
  background: linear-gradient(135deg, #059669 0%, #10B981 100%);
  border-color: transparent;
  color: white;
}

.add-btn {
  background: linear-gradient(135deg, #059669 0%, #10B981 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* ===== Type Chart Section ===== */
.type-chart-section {
  margin-bottom: 20px;
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
  background: #FFFFFF;
  border-radius: 14px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

:global(.dark-mode) .skeleton-record {
  background: #1E2A24;
}

.skeleton-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

:global(.dark-mode) .skeleton-icon-circle {
  background: linear-gradient(90deg, #2D4A3A 25%, #3A5A4A 50%, #2D4A3A 75%);
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
  background: linear-gradient(90deg, #2D4A3A 25%, #3A5A4A 50%, #2D4A3A 75%);
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
  background: #FFFFFF;
  border-radius: 20px;
  border: 2px dashed #D1FAE5;
}

:global(.dark-mode) .empty-state {
  background: #1E2A24;
  border-color: #2D4A3A;
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
  color: #88A8A0;
}

/* ===== Events List ===== */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
  background: #FFFFFF;
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

:global(.dark-mode) .event-item {
  background: #1E2A24;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@keyframes record-enter {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.event-item:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.12);
  transform: translateX(3px);
}

:global(.dark-mode) .event-item:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.08);
}

.event-accent {
  width: 4px;
  align-self: stretch;
  background: linear-gradient(180deg, #10B981 0%, #34D399 100%);
  border-radius: 4px 0 0 4px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.25s ease;
}

.event-accent.accent-completed {
  background: linear-gradient(180deg, #86EFAC 0%, #BBF7D0 100%);
}

.event-accent.accent-overdue {
  background: linear-gradient(180deg, #FCA5A5 0%, #FECACA 100%);
}

.event-item:hover .event-accent {
  opacity: 1;
}

.event-completed {
  opacity: 0.7;
}

.event-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
  padding: 14px 16px 14px 14px;
}

.event-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

:global(.dark-mode) .event-icon-wrap {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.1) 100%);
}

.event-item:hover .event-icon-wrap {
  transform: scale(1.08);
}

.event-icon {
  font-size: 22px;
  line-height: 1;
}

.event-info {
  min-width: 0;
}

.event-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.event-type-name {
  font-size: 15px;
  font-weight: 600;
  color: #2D2D2D;
}

:global(.dark-mode) .event-type-name {
  color: #E8E8E8;
}

.event-meta {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark-mode) .event-meta {
  color: #88A8A0;
}

.event-date {
  color: #6B6B6B;
}

:global(.dark-mode) .event-date {
  color: #A7F3D0;
}

.event-due {
  color: #6B6B6B;
}

:global(.dark-mode) .event-due {
  color: #A7F3D0;
}

.event-notes {
  color: #9CA3AF;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.dark-mode) .event-notes {
  color: #88A8A0;
}

.event-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  padding-right: 12px;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.event-item:hover .event-actions {
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
    gap: 12px;
    padding: 12px 16px;
  }

  .hero-stat-divider {
    display: none;
  }

  .hero-stat {
    gap: 6px;
  }

  .hero-stat-value {
    font-size: 18px;
  }

  .hero-stat-label {
    font-size: 11px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .toolbar-left {
    width: 100%;
  }

  .pet-selector-section {
    margin-bottom: 12px;
  }

  .toolbar-right {
    flex-wrap: wrap;
    justify-content: center;
  }

  .status-tabs {
    flex-wrap: wrap;
    justify-content: center;
  }

  .add-btn {
    width: 100%;
  }

  .event-item {
    flex-direction: column;
    align-items: stretch;
  }

  .event-left {
    padding: 12px 10px 8px 10px;
    gap: 10px;
  }

  .event-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .event-icon {
    font-size: 18px;
  }

  .event-type-name {
    font-size: 14px;
  }

  .event-actions {
    align-self: flex-end;
    padding: 0 10px 10px;
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
