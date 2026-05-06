<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { fetchFeedingRecordsPage, fetchFeedingStats } from '@/api.js';
import FeedingTrendChart from '@/components/FeedingTrendChart.vue';
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
  TrashOutline
} from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();

// State
const selectedPetId = ref(null);
const records = ref([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);
const feedingStats = ref(null);
const loadingStats = ref(false);
const statsDays = ref(30);

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

// Load feeding records
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
    const res = await fetchFeedingRecordsPage(params);
    records.value = res.data.records || [];
    total.value = res.data.total || 0;
  } catch (err) {
    console.error('加载喂养记录失败:', err);
    records.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// Load feeding stats
const loadStats = async () => {
  loadingStats.value = true;
  try {
    const params = {};
    if (statsDays.value) {
      params.days = statsDays.value;
    }
    if (selectedPetId.value) {
      params.petId = selectedPetId.value;
    }
    const res = await fetchFeedingStats(params);
    feedingStats.value = res.data;
  } catch (err) {
    console.error('加载喂养统计失败:', err);
    feedingStats.value = null;
  } finally {
    loadingStats.value = false;
  }
};

// Handle time range change from chart
const handleTimeRangeChange = (days) => {
  statsDays.value = days || null;
  loadStats();
};

// Watch pet selection
watch(selectedPetId, () => {
  pageNum.value = 1;
  loadRecords();
  loadStats();
});

// Pre-select from store
onMounted(async () => {
  if (petStore.petList.length === 0) {
    await petStore.loadPetList();
  }
  loadRecords();
  loadStats();
});

// Stats
const stats = computed(() => {
  const data = records.value;
  if (!data.length) return { total: 0, avgAmount: 0, topFood: '-' };
  
  const totalAmount = data.reduce((sum, r) => sum + (r.amountGrams || 0), 0);
  const withAmount = data.filter(r => r.amountGrams).length;
  
  // Most common food type
  const foodMap = {};
  data.forEach(r => {
    if (r.foodType) {
      foodMap[r.foodType] = (foodMap[r.foodType] || 0) + 1;
    }
  });
  const topFood = Object.entries(foodMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  
  return {
    total: total.value,
    avgAmount: withAmount ? Math.round(totalAmount / withAmount) : 0,
    topFood
  };
});

// Format date
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
};

// Get pet name
const getPetName = (petId) => {
  const pet = petStore.petList.find(p => p.id === petId);
  return pet ? pet.name : '未知宠物';
};

// Page change
const handlePageChange = (page) => {
  pageNum.value = page;
  loadRecords();
};

// Add new record
const handleAdd = () => {
  if (!authStore.isAuthenticated) {
    window.$message.warning('请先登录后再添加喂养记录');
    return;
  }
  // If a pet is selected, pre-fill; otherwise let user choose in form
  if (selectedPetId.value) {
    petStore.showFeedingRecordFormModal(selectedPetId.value);
  } else if (petStore.petList.length === 1) {
    petStore.showFeedingRecordFormModal(petStore.petList[0].id);
  } else {
    window.$message.info('请先选择一只宠物');
  }
};

// Edit record
const handleEdit = (record) => {
  if (!authStore.isAuthenticated) {
    window.$message.warning('请先登录后再编辑');
    return;
  }
  petStore.showFeedingRecordFormModal(record.petId, record);
};

// Delete record
const handleDelete = async (record) => {
  try {
    await petStore.handleDeleteFeedingRecord(record.id);
    window.$message.success('喂养记录已删除');
    loadRecords();
  } catch {
    window.$message.error('删除失败，请重试');
  }
};

// Watch for modal close to refresh
watch(() => petStore.feedingRecordFormModal.show, (show) => {
  if (!show) {
    loadRecords();
    loadStats();
  }
});
</script>

<template>
  <div class="feeding-records-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">
          <span class="page-title-icon">🍽️</span>
          喂养记录
        </h1>
        <p class="page-subtitle">记录宠物的每一次喂食</p>
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
            添加记录
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <n-card class="stat-card" :bordered="false">
        <div class="stat-card-content">
          <span class="stat-card-icon">📊</span>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.total }}</span>
            <span class="stat-card-label">总记录</span>
          </div>
        </div>
      </n-card>
      <n-card class="stat-card" :bordered="false">
        <div class="stat-card-content">
          <span class="stat-card-icon">⚖️</span>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.avgAmount }}<small>g</small></span>
            <span class="stat-card-label">平均食量</span>
          </div>
        </div>
      </n-card>
      <n-card class="stat-card" :bordered="false">
        <div class="stat-card-content">
          <span class="stat-card-icon">🏷️</span>
          <div class="stat-card-info">
            <span class="stat-card-value stat-card-value-text">{{ stats.topFood }}</span>
            <span class="stat-card-label">最常喂食</span>
          </div>
        </div>
      </n-card>
    </div>

    <!-- Feeding Trend Chart -->
    <div class="chart-section">
      <div v-if="loadingStats" class="chart-loading">
        <n-spin size="small" />
      </div>
      <feeding-trend-chart v-else :stats="feedingStats" @update:days="handleTimeRangeChange" />
    </div>

    <!-- Loading -->
    <n-spin v-if="loading" :show="true" style="width: 100%;">
      <div style="height: 200px;" />
    </n-spin>

    <!-- Empty State -->
    <n-card v-else-if="records.length === 0" class="empty-card" :bordered="false">
      <n-empty description="暂无喂养记录，快去给宠物添加第一条记录吧" size="large">
        <template #icon>
          <span style="font-size: 48px;">🍽️</span>
        </template>
        <template #extra>
          <n-button
            v-if="authStore.isAuthenticated && petStore.petList.length > 0"
            type="primary"
            size="small"
            @click="handleAdd"
          >
            添加喂养记录
          </n-button>
        </template>
      </n-empty>
    </n-card>

    <!-- Records List -->
    <div v-else class="records-list">
      <div
        v-for="record in records"
        :key="record.id"
        class="record-item"
      >
        <div class="record-left">
          <div class="record-icon">🍽️</div>
          <div class="record-info">
            <div class="record-main">
              <span class="record-food-type">{{ record.foodType || '未填写' }}</span>
              <n-tag v-if="record.amountGrams" size="small" round type="warning">
                {{ record.amountGrams }}g
              </n-tag>
              <n-tag v-if="!selectedPetId" size="small" round type="info">
                🐾 {{ getPetName(record.petId) }}
              </n-tag>
            </div>
            <div class="record-meta">
              <span class="record-time">{{ formatDateTime(record.feedTime) }}</span>
              <span v-if="record.notes" class="record-notes">· {{ record.notes }}</span>
            </div>
          </div>
        </div>
        <div class="record-actions" v-if="authStore.isAuthenticated">
          <n-button
            text
            size="small"
            type="primary"
            @click="handleEdit(record)"
          >
            <template #icon>
              <n-icon :component="CreateOutline" size="16" />
            </template>
          </n-button>
          <n-popconfirm @positive-click="handleDelete(record)">
            <template #trigger>
              <n-button text size="small" type="error">
                <template #icon>
                  <n-icon :component="TrashOutline" size="16" />
                </template>
              </n-button>
            </template>
            确定删除这条喂养记录吗？
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
.feeding-records-page {
  max-width: 800px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
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

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 16px !important;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(255, 155, 168, 0.08) 100%);
}

:global(.dark-mode) .stat-card {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(255, 155, 168, 0.08) 100%);
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

.stat-card-value small {
  font-size: 14px;
  font-weight: 600;
}

.stat-card-value-text {
  font-size: 18px;
}

.stat-card-label {
  font-size: 12px;
  color: #9CA3AF;
}

:global(.dark-mode) .stat-card-label {
  color: #8888A0;
}

/* Chart Section */
.chart-section {
  margin-bottom: 24px;
}

.chart-loading {
  display: flex;
  justify-content: center;
  padding: 30px;
}

/* Empty Card */
.empty-card {
  border-radius: 20px !important;
  padding: 60px 20px;
  text-align: center;
}

/* Records List */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: #FFFFFF;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.record-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

:global(.dark-mode) .record-item {
  background: #2A2A45;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

:global(.dark-mode) .record-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.record-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.record-icon {
  font-size: 24px;
  flex-shrink: 0;
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

.record-food-type {
  font-size: 15px;
  font-weight: 600;
  color: #2D2D2D;
}

:global(.dark-mode) .record-food-type {
  color: #E8E8E8;
}

.record-meta {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark-mode) .record-meta {
  color: #8888A0;
}

.record-time {
  color: #6B6B6B;
}

:global(.dark-mode) .record-time {
  color: #B8B8CC;
}

.record-notes {
  color: #9CA3AF;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.dark-mode) .record-notes {
  color: #8888A0;
}

.record-actions {
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
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .stat-card-icon {
    font-size: 22px;
  }

  .stat-card-value {
    font-size: 18px;
  }

  .stat-card-value-text {
    font-size: 14px;
  }

  .record-item {
    padding: 12px;
  }

  .record-food-type {
    font-size: 14px;
  }
}
</style>
