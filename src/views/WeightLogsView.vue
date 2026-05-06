<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { fetchWeightLogsPage } from '@/api.js';
import WeightTrendChart from '@/components/WeightTrendChart.vue';
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

const selectedPetId = ref(null);
const records = ref([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);

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
    const res = await fetchWeightLogsPage(params);
    records.value = res.data.records || [];
    total.value = res.data.total || 0;
  } catch (err) {
    console.error('加载体重记录失败:', err);
    records.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

watch(selectedPetId, () => {
  pageNum.value = 1;
  loadRecords();
});

onMounted(async () => {
  if (petStore.petList.length === 0) {
    await petStore.loadPetList();
  }
  loadRecords();
});

const stats = computed(() => {
  const data = records.value;
  if (!data.length) return { total: 0, latest: '-', min: '-', max: '-' };
  const weights = data.map(r => parseFloat(r.weightKg)).filter(w => !isNaN(w));
  if (!weights.length) return { total: total.value, latest: '-', min: '-', max: '-' };
  return {
    total: total.value,
    latest: weights[0].toFixed(1),
    min: Math.min(...weights).toFixed(1),
    max: Math.max(...weights).toFixed(1)
  };
});

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getPetName = (petId) => {
  const pet = petStore.petList.find(p => p.id === petId);
  return pet ? pet.name : '未知宠物';
};

const handlePageChange = (page) => {
  pageNum.value = page;
  loadRecords();
};

const handleAdd = () => {
  if (!authStore.isAuthenticated) {
    window.$message.warning('请先登录后再添加体重记录');
    return;
  }
  if (selectedPetId.value) {
    petStore.showWeightLogFormModal(selectedPetId.value);
  } else if (petStore.petList.length === 1) {
    petStore.showWeightLogFormModal(petStore.petList[0].id);
  } else {
    window.$message.info('请先选择一只宠物');
  }
};

const handleEdit = (record) => {
  if (!authStore.isAuthenticated) {
    window.$message.warning('请先登录后再编辑');
    return;
  }
  petStore.showWeightLogFormModal(record.petId, record);
};

const handleDelete = async (record) => {
  try {
    await petStore.handleDeleteWeightLog(record.id);
    window.$message.success('体重记录已删除');
    loadRecords();
  } catch {
    window.$message.error('删除失败，请重试');
  }
};

watch(() => petStore.weightLogFormModal.show, (show) => {
  if (!show) {
    loadRecords();
  }
});
</script>

<template>
  <div class="weight-logs-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">
          <span class="page-title-icon">⚖️</span>
          体重管理
        </h1>
        <p class="page-subtitle">追踪宠物体重变化，守护健康</p>
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
            记录体重
          </n-button>
        </n-space>
      </div>
    </div>

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
          <span class="stat-card-icon">📏</span>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.latest }}<small v-if="stats.latest !== '-'">kg</small></span>
            <span class="stat-card-label">最新体重</span>
          </div>
        </div>
      </n-card>
      <n-card class="stat-card" :bordered="false">
        <div class="stat-card-content">
          <span class="stat-card-icon">⬇️</span>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.min }}<small v-if="stats.min !== '-'">kg</small></span>
            <span class="stat-card-label">最低体重</span>
          </div>
        </div>
      </n-card>
      <n-card class="stat-card" :bordered="false">
        <div class="stat-card-content">
          <span class="stat-card-icon">⬆️</span>
          <div class="stat-card-info">
            <span class="stat-card-value">{{ stats.max }}<small v-if="stats.max !== '-'">kg</small></span>
            <span class="stat-card-label">最高体重</span>
          </div>
        </div>
      </n-card>
    </div>

    <div class="chart-section">
      <weight-trend-chart :weight-logs="records" />
    </div>

    <n-spin v-if="loading" :show="true" style="width: 100%;">
      <div style="height: 200px;" />
    </n-spin>

    <n-card v-else-if="records.length === 0" class="empty-card" :bordered="false">
      <n-empty description="暂无体重记录，快去给宠物记录第一次体重吧" size="large">
        <template #icon>
          <span style="font-size: 48px;">⚖️</span>
        </template>
        <template #extra>
          <n-button
            v-if="authStore.isAuthenticated && petStore.petList.length > 0"
            type="primary"
            size="small"
            @click="handleAdd"
          >
            记录体重
          </n-button>
        </template>
      </n-empty>
    </n-card>

    <div v-else class="records-list">
      <div
        v-for="record in records"
        :key="record.id"
        class="record-item"
      >
        <div class="record-left">
          <div class="record-icon">⚖️</div>
          <div class="record-info">
            <div class="record-main">
              <span class="record-weight">{{ record.weightKg }} kg</span>
              <n-tag v-if="!selectedPetId" size="small" round type="info">
                🐾 {{ getPetName(record.petId) }}
              </n-tag>
            </div>
            <div class="record-meta">
              <span class="record-date">{{ formatDate(record.logDate) }}</span>
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
            确定删除这条体重记录吗？
          </n-popconfirm>
        </div>
      </div>

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
.weight-logs-page {
  max-width: 800px;
  margin: 0 auto;
}

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

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 16px !important;
  background: linear-gradient(135deg, rgba(125, 211, 252, 0.08) 0%, rgba(56, 189, 248, 0.06) 100%);
}

:global(.dark-mode) .stat-card {
  background: linear-gradient(135deg, rgba(125, 211, 252, 0.12) 0%, rgba(56, 189, 248, 0.08) 100%);
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
  font-size: 22px;
  font-weight: 700;
  color: #38BDF8;
  line-height: 1.2;
}

.stat-card-value small {
  font-size: 13px;
  font-weight: 600;
}

.stat-card-label {
  font-size: 12px;
  color: #9CA3AF;
}

:global(.dark-mode) .stat-card-label {
  color: #8888A0;
}

.chart-section {
  margin-bottom: 24px;
}

.empty-card {
  border-radius: 20px !important;
  padding: 60px 20px;
  text-align: center;
}

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

.record-weight {
  font-size: 16px;
  font-weight: 700;
  color: #2D2D2D;
}

:global(.dark-mode) .record-weight {
  color: #E8E8E8;
}

.record-meta {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
}

:global(.dark-mode) .record-meta {
  color: #8888A0;
}

.record-date {
  color: #6B6B6B;
}

:global(.dark-mode) .record-date {
  color: #B8B8CC;
}

.record-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

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

  .record-item {
    padding: 12px;
  }

  .record-weight {
    font-size: 15px;
  }
}
</style>
