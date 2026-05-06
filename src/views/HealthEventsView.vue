<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { fetchHealthEventsPage, fetchHealthEventsStats, deleteHealthEvent, completeHealthEvent, uncompleteHealthEvent } from '@/api.js';
import { getEventTypeIcon } from '@/utils/eventTypeIcon.js';
import {
  NSelect,
  NCard,
  NTag,
  NSpace,
  NEmpty,
  NSpin,
  NButton,
  NIcon,
  NPagination,
  NPopconfirm
} from 'naive-ui';
import {
  PawOutline,
  AddOutline,
  CreateOutline,
  TrashOutline,
  CheckmarkCircleOutline,
  ArrowUndoOutline
} from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();
const dictStore = useDictionaryStore();

// State
const selectedPetId = ref(null);
const statusFilter = ref(null); // null=all, 0=pending, 1=completed
const records = ref([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);

// Stats state
const stats = ref({ totalCount: 0, pendingCount: 0, completedCount: 0, overdueCount: 0, typeBreakdown: [] });
const statsLoading = ref(false);

// Pet selector options
const petOptions = computed(() => {
  return [
    { label: '全部宠物', value: null },
    ...petStore.petList.map(pet => ({
      label: pet.name,
      value: pet.id
    }))
  ];
});

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
watch(selectedPetId, () => {
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
  <div class="health-events-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">
          <span class="page-title-icon">🩺</span>
          健康事件
        </h1>
        <p class="page-subtitle">疫苗、驱虫、体检，守护宠物健康</p>
      </div>
      <div class="page-header-right">
        <n-space align="center" :size="12">
          <n-select
            v-model:value="selectedPetId"
            :options="petOptions"
            placeholder="选择宠物"
            clearable
            filterable
            style="width: 180px;"
            class="pet-selector"
          >
            <template #prefix>
              <n-icon :component="PawOutline" size="16" />
            </template>
          </n-select>
          <n-button
            type="primary"
            @click="handleAdd"
            :disabled="!authStore.isAuthenticated || petStore.petList.length === 0"
          >
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            添加事件
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- Status Filter Tabs -->
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

    <!-- Stats Cards -->
    <div class="stats-row">
      <n-card class="stat-card stat-card-total" :bordered="false">
        <div class="stat-card-content">
          <span class="stat-card-icon">📋</span>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.totalCount }}</span>
            <span class="stat-card-label">总事件</span>
          </div>
        </div>
      </n-card>
      <n-card class="stat-card stat-card-pending" :bordered="false">
        <div class="stat-card-content">
          <span class="stat-card-icon">⏳</span>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.pendingCount }}</span>
            <span class="stat-card-label">待处理</span>
          </div>
        </div>
      </n-card>
      <n-card class="stat-card stat-card-completed" :bordered="false">
        <div class="stat-card-content">
          <span class="stat-card-icon">✅</span>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.completedCount }}</span>
            <span class="stat-card-label">已完成</span>
          </div>
        </div>
      </n-card>
      <n-card class="stat-card stat-card-overdue" :bordered="false">
        <div class="stat-card-content">
          <span class="stat-card-icon">⚠️</span>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.overdueCount }}</span>
            <span class="stat-card-label">已过期</span>
          </div>
        </div>
      </n-card>
    </div>

    <!-- Event Type Breakdown -->
    <div v-if="stats.typeBreakdown && stats.typeBreakdown.length > 0" class="type-breakdown">
      <div class="type-breakdown-label">事件类型分布</div>
      <div class="type-breakdown-items">
        <div
          v-for="item in stats.typeBreakdown"
          :key="item.eventTypeId"
          class="type-breakdown-chip"
        >
          <span class="type-chip-icon">{{ getEventTypeIcon(item.eventTypeName) }}</span>
          <span class="type-chip-name">{{ item.eventTypeName }}</span>
          <span class="type-chip-count">{{ item.count }}</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <n-spin v-if="loading" :show="true" style="width: 100%;">
      <div style="height: 200px;" />
    </n-spin>

    <!-- Empty State -->
    <n-card v-else-if="records.length === 0" class="empty-card" :bordered="false">
      <n-empty description="暂无健康事件记录，快去给宠物添加第一条记录吧" size="large">
        <template #icon>
          <span style="font-size: 48px;">🩺</span>
        </template>
        <template #extra>
          <n-button
            v-if="authStore.isAuthenticated && petStore.petList.length > 0"
            type="primary"
            size="small"
            @click="handleAdd"
          >
            添加健康事件
          </n-button>
        </template>
      </n-empty>
    </n-card>

    <!-- Events List -->
    <div v-else class="events-list">
      <div
        v-for="event in records"
        :key="event.id"
        class="event-item"
        :class="{ 'event-completed': event.status === 1, 'event-overdue': getDaysInfo(event.nextDueDate)?.type === 'error' && event.status !== 1 }"
      >
        <div class="event-left">
          <div class="event-icon">{{ getEventTypeIcon(getEventTypeName(event)) }}</div>
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
              <n-button text size="small" type="warning" title="撤销完成">
                <template #icon>
                  <n-icon :component="ArrowUndoOutline" size="16" />
                </template>
              </n-button>
            </template>
            确定将此事件恢复为待处理状态吗？
          </n-popconfirm>
          <n-popconfirm v-else @positive-click="handleComplete(event)">
            <template #trigger>
              <n-button text size="small" type="success" title="标记完成">
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
            @click="handleEdit(event)"
          >
            <template #icon>
              <n-icon :component="CreateOutline" size="16" />
            </template>
          </n-button>
          <n-popconfirm @positive-click="handleDelete(event)">
            <template #trigger>
              <n-button text size="small" type="error">
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

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2D2D2D;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

:global(.dark-mode) .page-title {
  color: #FFFFFF;
}

.page-title-icon {
  font-size: 32px;
}

.page-subtitle {
  font-size: 14px;
  color: #9CA3AF;
  margin: 4px 0 0 42px;
}

:global(.dark-mode) .page-subtitle {
  color: #8888A0;
}

/* Status Tabs */
.status-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.status-tab {
  padding: 8px 20px;
  border-radius: 20px;
  border: 1.5px solid #E5E7EB;
  background: #FFFFFF;
  color: #6B7280;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-tab:hover {
  border-color: #FF9BA8;
  color: #FF9BA8;
}

.status-tab.active {
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 155, 168, 0.3);
}

:global(.dark-mode) .status-tab {
  background: #2A2A45;
  border-color: #3D3D5C;
  color: #B8B8CC;
}

:global(.dark-mode) .status-tab:hover {
  border-color: #FF9BA8;
  color: #FF9BA8;
}

:global(.dark-mode) .status-tab.active {
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%);
  border-color: transparent;
  color: white;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 16px !important;
  background: linear-gradient(135deg, rgba(134, 239, 172, 0.08) 0%, rgba(125, 211, 252, 0.08) 100%);
}

:global(.dark-mode) .stat-card {
  background: linear-gradient(135deg, rgba(134, 239, 172, 0.12) 0%, rgba(125, 211, 252, 0.08) 100%);
}

.stat-card-total {
  background: linear-gradient(135deg, rgba(125, 211, 252, 0.12) 0%, rgba(125, 211, 252, 0.04) 100%) !important;
}

.stat-card-pending {
  background: linear-gradient(135deg, rgba(252, 211, 77, 0.12) 0%, rgba(252, 211, 77, 0.04) 100%) !important;
}

.stat-card-completed {
  background: linear-gradient(135deg, rgba(134, 239, 172, 0.12) 0%, rgba(134, 239, 172, 0.04) 100%) !important;
}

.stat-card-overdue {
  background: linear-gradient(135deg, rgba(252, 165, 165, 0.12) 0%, rgba(252, 165, 165, 0.04) 100%) !important;
}

:global(.dark-mode) .stat-card-total {
  background: linear-gradient(135deg, rgba(125, 211, 252, 0.15) 0%, rgba(125, 211, 252, 0.05) 100%) !important;
}

:global(.dark-mode) .stat-card-pending {
  background: linear-gradient(135deg, rgba(252, 211, 77, 0.15) 0%, rgba(252, 211, 77, 0.05) 100%) !important;
}

:global(.dark-mode) .stat-card-completed {
  background: linear-gradient(135deg, rgba(134, 239, 172, 0.15) 0%, rgba(134, 239, 172, 0.05) 100%) !important;
}

:global(.dark-mode) .stat-card-overdue {
  background: linear-gradient(135deg, rgba(252, 165, 165, 0.15) 0%, rgba(252, 165, 165, 0.05) 100%) !important;
}

.stat-card-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-card-icon {
  font-size: 28px;
}

.stat-card-info {
  display: flex;
  flex-direction: column;
}

.stat-card-value {
  font-size: 24px;
  font-weight: 700;
  color: #FF9BA8;
  line-height: 1.2;
}

.stat-card-label {
  font-size: 12px;
  color: #9CA3AF;
}

:global(.dark-mode) .stat-card-label {
  color: #8888A0;
}

/* Type Breakdown */
.type-breakdown {
  margin-bottom: 20px;
}

.type-breakdown-label {
  font-size: 13px;
  color: #9CA3AF;
  margin-bottom: 8px;
  font-weight: 600;
}

:global(.dark-mode) .type-breakdown-label {
  color: #8888A0;
}

.type-breakdown-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-breakdown-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: #FFF5F7;
  border: 1px solid #F0E6E0;
  font-size: 13px;
  transition: all 0.2s ease;
}

.type-breakdown-chip:hover {
  box-shadow: 0 2px 8px rgba(255, 155, 168, 0.15);
  transform: translateY(-1px);
}

:global(.dark-mode) .type-breakdown-chip {
  background: #2A2A45;
  border-color: #3D3D5C;
}

.type-chip-icon {
  font-size: 16px;
}

.type-chip-name {
  font-weight: 600;
  color: #4A4A4A;
}

:global(.dark-mode) .type-chip-name {
  color: #E8E8E8;
}

.type-chip-count {
  font-weight: 700;
  font-size: 12px;
  color: #FFFFFF;
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%);
  border-radius: 10px;
  padding: 1px 8px;
  min-width: 20px;
  text-align: center;
}

/* Empty Card */
.empty-card {
  border-radius: 20px !important;
  padding: 60px 20px;
  text-align: center;
}

/* Events List */
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
  padding: 14px 16px;
  background: #FFFFFF;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.event-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.event-completed {
  opacity: 0.7;
  border-left-color: #86EFAC;
}

.event-overdue {
  border-left-color: #FCA5A5;
}

:global(.dark-mode) .event-item {
  background: #2A2A45;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

:global(.dark-mode) .event-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.event-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.event-icon {
  font-size: 24px;
  flex-shrink: 0;
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
  color: #8888A0;
}

.event-date {
  color: #6B6B6B;
}

:global(.dark-mode) .event-date {
  color: #B8B8CC;
}

.event-due {
  color: #6B6B6B;
}

:global(.dark-mode) .event-due {
  color: #B8B8CC;
}

.event-notes {
  color: #9CA3AF;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.dark-mode) .event-notes {
  color: #8888A0;
}

.event-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Pagination */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-left {
    text-align: center;
  }

  .page-subtitle {
    margin-left: 0;
  }

  .page-header-right {
    display: flex;
    justify-content: center;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card-icon {
    font-size: 22px;
  }

  .stat-card-value {
    font-size: 18px;
  }

  .event-item {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
  }

  .event-actions {
    align-self: flex-end;
  }

  .event-type-name {
    font-size: 14px;
  }

  .status-tabs {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
