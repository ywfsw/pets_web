<script setup>
import { ref, h, watch, computed, onMounted } from 'vue';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { usePetStore } from '@/stores/petStore.js';
import DictTypeTree from '@/components/DictTypeTree.vue';
import {
  NGrid,
  NGi,
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  NTree,
  useMessage,
  NIcon
} from 'naive-ui';
import { Add, CreateOutline, TrashOutline } from '@vicons/ionicons5';

const dictStore = useDictionaryStore();
const petStore = usePetStore();
const message = useMessage();

const mounted = ref(false);
onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true; });
});

const currentTab = ref('pets');

// --- Pets Tab ---
const handleCreatePet = () => { petStore.showPetFormModal(null); };
const handleEditPet = (pet) => { petStore.showPetFormModal(pet); };
const handleDeletePet = (petId) => {
  petStore.handleDeletePet(petId).then(() => {
    message.success('宠物删除成功');
  });
};

const petTableColumns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '名字', key: 'name', width: 120 },
  { title: '物种', key: 'speciesLabel', width: 100 },
  { title: '品种', key: 'breedLabel', width: 120 },
  { title: '生日', key: 'birthday', width: 120 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render(row) {
      return h(NSpace, { size: 'small' }, () => [
        h(NButton, {
          size: 'small',
          onClick: () => handleEditPet(row)
        }, () => '编辑'),
        h(NPopconfirm, {
          onPositiveClick: () => handleDeletePet(row.id)
        }, {
          trigger: () => h(NButton, { size: 'small', type: 'error' }, () => '删除'),
          default: () => `确定要删除 [${row.name}] 吗？`
        })
      ]);
    }
  }
];

// --- Dictionaries Tab ---
const selectedDictType = ref({ dictCode: null });
const onTypeSelect = (type) => {
  if (type && type.dictCode) {
    selectedDictType.value = type;
    dictItemTreeSelectedKeys.value = [];
    dictStore.loadDictItems(type.dictCode);
  }
};
const handleCreateItem = () => {
  if (selectedDictType.value && selectedDictType.value.dictCode) {
    dictStore.showDictItemModal(selectedDictType.value, null);
  } else {
    message.warning('请先从左侧选择一个字典类型');
  }
};
const handleEditDictItem = (item) => {
  dictStore.showDictItemModal(selectedDictType.value, item);
};
const handleDeleteDictItem = async (item) => {
  try {
    await dictStore.handleDeleteDictItem(item.id, selectedDictType.value.dictCode);
    message.success('字典项删除成功');
  } catch {
    message.error('删除失败，请重试');
  }
};

// 构建字典项树形数据
const dictItemTreeData = computed(() => {
  const items = dictStore.dictItemList;
  if (!items || items.length === 0) return [];
  const parents = items.filter(item => !item.parentId);
  const children = items.filter(item => item.parentId);
  if (children.length === 0) {
    return parents.map(item => ({
      key: `item-${item.id}`,
      label: `${item.itemLabel} (${item.itemValue})`,
      isLeaf: true,
      _raw: item
    }));
  }
  const childMap = new Map();
  for (const child of children) {
    if (!childMap.has(child.parentId)) {
      childMap.set(child.parentId, []);
    }
    childMap.get(child.parentId).push(child);
  }
  const parentNodes = parents.map(parent => ({
    key: `parent-${parent.id}`,
    label: `${parent.itemLabel} (${parent.itemValue})`,
    _raw: parent,
    children: (childMap.get(parent.id) || []).map(child => ({
      key: `item-${child.id}`,
      label: `${child.itemLabel} (${child.itemValue})`,
      isLeaf: true,
      _raw: child
    }))
  }));
  const orphanChildren = children.filter(child => {
    return !parents.some(p => p.id === child.parentId);
  });
  if (orphanChildren.length > 0) {
    const orphanParentIds = [...new Set(orphanChildren.map(c => c.parentId))];
    for (const parentId of orphanParentIds) {
      const parentLabel = orphanChildren.find(c => c.parentId === parentId)?.parentLabel || `ID: ${parentId}`;
      parentNodes.push({
        key: `parent-resolved-${parentId}`,
        label: `${parentLabel}`,
        children: orphanChildren.filter(c => c.parentId === parentId).map(child => ({
          key: `item-${child.id}`,
          label: `${child.itemLabel} (${child.itemValue})`,
          isLeaf: true,
          _raw: child
        }))
      });
    }
  }
  return parentNodes;
});

const dictItemTreeSelectedKeys = ref([]);

const handleDictItemTreeSelect = (keys) => {
  dictItemTreeSelectedKeys.value = keys;
};

const getSelectedItem = () => {
  const key = dictItemTreeSelectedKeys.value[0];
  if (!key) return null;
  const findItem = (nodes) => {
    for (const node of nodes) {
      if (node.key === key && node._raw && node.key.startsWith('item-')) return node._raw;
      if (node.children) {
        const found = findItem(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return findItem(dictItemTreeData.value);
};

// Watch for dictTypeTree data and select the first item if available
watch(() => dictStore.dictTypeTree, (newTree) => {
  if (newTree && newTree.length > 0 && currentTab.value === 'dictionaries') {
    const firstItem = newTree[0];
    if (firstItem && firstItem.dictCode) {
      selectedDictType.value = firstItem;
      dictStore.loadDictItems(firstItem.dictCode);
    }
  }
}, { immediate: true });

// Watch for tab changes to trigger initial load if on dictionaries tab
watch(currentTab, (newTab) => {
  if (newTab === 'dictionaries' && dictStore.dictTypeTree.length > 0 && !selectedDictType.value.dictCode) {
    const firstItem = dictStore.dictTypeTree[0];
    selectedDictType.value = firstItem;
    dictStore.loadDictItems(firstItem.dictCode);
  }
});
</script>

<template>
  <div class="admin-page" :class="{ 'is-mounted': mounted }">
    <!-- Immersive Hero -->
    <div class="admin-hero section-entrance">
      <div class="hero-gradient-frame">
        <div class="hero-inner">
          <div class="hero-decorations">
            <span class="hero-shape shape-1">⚙️</span>
            <span class="hero-shape shape-2">📋</span>
            <span class="hero-shape shape-3">✨</span>
            <span class="hero-shape shape-4">🔧</span>
            <span class="hero-shape shape-5">📊</span>
            <span class="hero-shape shape-6">🐾</span>
          </div>
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="hero-title-icon">⚙️</span>
              <span class="hero-title-text">后台管理</span>
            </h1>
            <p class="hero-subtitle">宠物资料与字典数据，尽在掌控</p>
          </div>
          <div class="hero-stats-bar">
            <div class="hero-stat">
              <span class="hero-stat-icon">🐾</span>
              <span class="hero-stat-value">{{ petStore.petList.length }}</span>
              <span class="hero-stat-label">宠物数量</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">📖</span>
              <span class="hero-stat-value">{{ dictStore.dictTypeTree.length }}</span>
              <span class="hero-stat-label">字典类型</span>
            </div>
            <div class="hero-stat-divider" />
            <div class="hero-stat">
              <span class="hero-stat-icon">📝</span>
              <span class="hero-stat-value">{{ dictStore.dictItemList.length }}</span>
              <span class="hero-stat-label">字典项</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Section -->
    <div class="admin-tabs-section section-entrance" style="animation-delay: 0.15s">
      <div class="tabs-header">
        <button
          class="tab-pill"
          :class="{ active: currentTab === 'pets' }"
          @click="currentTab = 'pets'"
        >
          🐾 宠物管理
        </button>
        <button
          class="tab-pill"
          :class="{ active: currentTab === 'dictionaries' }"
          @click="currentTab = 'dictionaries'"
        >
          📖 字典管理
        </button>
      </div>

      <!-- Pets Tab -->
      <div v-show="currentTab === 'pets'" class="tab-content">
        <div class="section-card">
          <div class="section-card-header">
            <h3 class="section-card-title">🐾 宠物列表</h3>
            <n-button @click="handleCreatePet" class="add-btn" size="small">
              <template #icon>
                <n-icon><Add /></n-icon>
              </template>
              添加新宠物
            </n-button>
          </div>
          <!-- Skeleton loading -->
          <div v-if="petStore.loadingList" class="skeleton-container">
            <div v-for="i in 5" :key="i" class="skeleton-row">
              <div class="skeleton-cell w-60" /><div class="skeleton-cell w-80" />
              <div class="skeleton-cell w-60" /><div class="skeleton-cell w-80" />
              <div class="skeleton-cell w-80" /><div class="skeleton-cell w-100" />
            </div>
          </div>
          <!-- Empty state -->
          <div v-else-if="petStore.petList.length === 0" class="custom-empty">
            <div class="empty-icon">🐾</div>
            <p class="empty-title">暂无宠物数据</p>
            <p class="empty-desc">点击上方按钮添加第一只宠物吧</p>
          </div>
          <!-- Data table -->
          <n-data-table
            v-else
            :columns="petTableColumns"
            :data="petStore.petList"
            :loading="petStore.loadingList"
            :pagination="{ page: petStore.currentPage, pageCount: petStore.totalPages, itemCount: petStore.pagination.total }"
            :remote="true"
            @update:page="petStore.loadPetList"
            :row-key="row => row.id"
            :bordered="false"
            class="admin-table"
          />
        </div>
      </div>

      <!-- Dictionaries Tab -->
      <div v-show="currentTab === 'dictionaries'" class="tab-content">
        <n-grid :x-gap="20" :y-gap="20" :cols="3" responsive="screen" :item-responsive="true">
          <n-gi :span="1">
            <div class="section-card dict-type-section">
              <div class="section-card-header">
                <h3 class="section-card-title">📂 字典类型</h3>
              </div>
              <!-- Skeleton -->
              <div v-if="dictStore.loadingTypes" class="skeleton-container">
                <div v-for="i in 4" :key="i" class="skeleton-tree-node">
                  <div class="skeleton-cell w-60" />
                </div>
              </div>
              <!-- Empty -->
              <div v-else-if="dictStore.dictTypeTree.length === 0" class="custom-empty compact">
                <div class="empty-icon">📂</div>
                <p class="empty-title">暂无字典类型</p>
              </div>
              <!-- Tree -->
              <div v-else class="dict-type-tree-wrapper">
                <DictTypeTree
                  :treeData="dictStore.dictTypeTree"
                  v-model:selectedCode="selectedDictType.dictCode"
                  @select="onTypeSelect"
                />
              </div>
            </div>
          </n-gi>
          <n-gi :span="2">
            <div class="section-card dict-item-section">
              <div class="section-card-header">
                <h3 class="section-card-title">
                  {{ selectedDictType.dictCode ? `📝 字典项 — ${selectedDictType.dictCode}` : '📝 字典项' }}
                </h3>
                <n-space :size="8" v-if="selectedDictType.dictCode">
                  <n-button
                    v-if="getSelectedItem()"
                    size="small"
                    quaternary
                    type="info"
                    @click="handleEditDictItem(getSelectedItem())"
                  >
                    <template #icon><n-icon :component="CreateOutline" /></template>
                    编辑
                  </n-button>
                  <n-popconfirm
                    v-if="getSelectedItem()"
                    @positive-click="handleDeleteDictItem(getSelectedItem())"
                  >
                    <template #trigger>
                      <n-button size="small" quaternary type="error">
                        <template #icon><n-icon :component="TrashOutline" /></template>
                        删除
                      </n-button>
                    </template>
                    确定要删除 [{{ getSelectedItem()?.itemLabel }}] 吗？
                  </n-popconfirm>
                  <n-button
                    @click="handleCreateItem"
                    size="small"
                    class="add-btn"
                  >
                    <template #icon><n-icon><Add /></n-icon></template>
                    添加字典项
                  </n-button>
                </n-space>
              </div>
              <!-- Skeleton -->
              <div v-if="dictStore.loadingItems" class="skeleton-container">
                <div v-for="i in 6" :key="i" class="skeleton-tree-node">
                  <div class="skeleton-cell" :class="i % 2 === 0 ? 'w-80' : 'w-60'" />
                </div>
              </div>
              <!-- No type selected -->
              <div v-else-if="!selectedDictType.dictCode" class="custom-empty">
                <div class="empty-icon">👈</div>
                <p class="empty-title">请选择字典类型</p>
                <p class="empty-desc">从左侧选择一个字典类型以查看其字典项</p>
              </div>
              <!-- Tree data -->
              <div v-else-if="dictItemTreeData.length > 0" class="dict-item-tree-wrapper">
                <n-tree
                  :data="dictItemTreeData"
                  :selected-keys="dictItemTreeSelectedKeys"
                  :on-update:selected-keys="handleDictItemTreeSelect"
                  default-expand-all
                  selectable
                  block-line
                  key-field="key"
                  label-field="label"
                  children-field="children"
                  class="dict-item-tree"
                />
              </div>
              <!-- Empty items -->
              <div v-else class="custom-empty compact">
                <div class="empty-icon">📭</div>
                <p class="empty-title">该字典类型下暂无字典项</p>
                <n-button size="small" class="add-btn" @click="handleCreateItem" style="margin-top: 12px">
                  <template #icon><n-icon><Add /></n-icon></template>
                  添加第一个字典项
                </n-button>
              </div>
            </div>
          </n-gi>
        </n-grid>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ====== Page Container ====== */
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* ====== Section Entrance Animation ====== */
.section-entrance {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.is-mounted .section-entrance {
  opacity: 1;
  transform: translateY(0);
}

/* ====== Hero Area ====== */
.admin-hero {
  margin-bottom: 24px;
}

.hero-gradient-frame {
  border-radius: 24px;
  padding: 3px;
  background: linear-gradient(135deg, #FF9BA8 0%, #C084FC 50%, #818CF8 100%);
  box-shadow: 0 8px 32px rgba(255, 155, 168, 0.15);
}

.hero-inner {
  position: relative;
  border-radius: 22px;
  padding: 32px 36px 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
}

.hero-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-shape {
  position: absolute;
  font-size: 24px;
  opacity: 0.18;
  animation: floatShape 8s ease-in-out infinite;
}

.shape-1 { top: 10%; left: 8%; animation-delay: 0s; font-size: 28px; }
.shape-2 { top: 15%; right: 12%; animation-delay: 1.2s; font-size: 22px; }
.shape-3 { bottom: 20%; left: 15%; animation-delay: 2.4s; }
.shape-4 { top: 50%; right: 20%; animation-delay: 0.8s; font-size: 20px; }
.shape-5 { bottom: 10%; right: 8%; animation-delay: 1.6s; font-size: 26px; }
.shape-6 { top: 60%; left: 5%; animation-delay: 3s; font-size: 18px; }

@keyframes floatShape {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(5deg); }
  50% { transform: translateY(-4px) rotate(-3deg); }
  75% { transform: translateY(-10px) rotate(2deg); }
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 20px;
}

.hero-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.hero-title-icon {
  font-size: 36px;
  animation: gentleBounce 3s ease-in-out infinite;
}

@keyframes gentleBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.hero-title-text {
  background: linear-gradient(135deg, #FF9BA8 0%, #C084FC 50%, #818CF8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 14px;
  color: #8B8FA3;
  margin: 0;
  font-weight: 500;
}

.hero-stats-bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid rgba(255, 155, 168, 0.15);
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 20px;
}

.hero-stat-icon {
  font-size: 18px;
}

.hero-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #2D2D2D;
}

.hero-stat-label {
  font-size: 12px;
  color: #8B8FA3;
  font-weight: 500;
}

.hero-stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 155, 168, 0.2);
}

/* ====== Tabs Section ====== */
.admin-tabs-section {
  margin-bottom: 24px;
}

.tabs-header {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 4px;
  background: var(--pet-card, #fff);
  border-radius: 16px;
  border: 1px solid var(--pet-border, rgba(0,0,0,0.06));
  width: fit-content;
}

.tab-pill {
  padding: 10px 24px;
  border-radius: 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--pet-text-secondary, #8B8FA3);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab-pill:hover {
  color: var(--pet-text, #2D2D2D);
  background: var(--pet-bg, #F9FAFB);
}

.tab-pill.active {
  background: linear-gradient(135deg, #FF9BA8 0%, #C084FC 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 155, 168, 0.3);
}

.tab-content {
  animation: fadeInTab 0.3s ease;
}

@keyframes fadeInTab {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ====== Section Card ====== */
.section-card {
  background: var(--pet-card, #fff);
  border-radius: 20px;
  border: 1px solid var(--pet-border, rgba(0,0,0,0.06));
  padding: 24px;
  transition: box-shadow 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 4px 20px rgba(255, 155, 168, 0.08);
}

.section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--pet-text, #2D2D2D);
  margin: 0;
}

/* ====== Add Button ====== */
.add-btn {
  background: linear-gradient(135deg, #FF9BA8 0%, #C084FC 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(255, 155, 168, 0.3);
  transition: all 0.3s ease !important;
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.4) !important;
}

/* ====== Table Styles ====== */
.admin-table {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.n-data-table-th) {
  background: var(--pet-bg-secondary, #F3F4F6) !important;
  font-weight: 600 !important;
  font-size: 13px;
  color: var(--pet-text-secondary, #6B7280) !important;
}

:deep(.n-data-table-td) {
  font-size: 14px;
  color: var(--pet-text, #2D2D2D);
}

:deep(.n-data-table-tr) {
  transition: background 0.2s ease;
}

:deep(.n-data-table-tr:hover) {
  background: var(--pet-bg, #F9FAFB) !important;
}

:deep(.n-data-table) {
  --n-th-color: transparent;
  --n-td-color: transparent;
  --n-border-color: var(--pet-border, rgba(0,0,0,0.06));
}

/* ====== Skeleton Loading ====== */
.skeleton-container {
  padding: 16px 0;
}

.skeleton-row {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--pet-border, rgba(0,0,0,0.04));
}

.skeleton-cell {
  height: 16px;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--pet-bg, #F3F4F6) 25%, var(--pet-bg-secondary, #E5E7EB) 50%, var(--pet-bg, #F3F4F6) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-cell.w-60 { width: 60px; }
.skeleton-cell.w-80 { width: 80px; }
.skeleton-cell.w-100 { width: 100px; }

.skeleton-tree-node {
  padding: 10px 0;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ====== Custom Empty State ====== */
.custom-empty {
  text-align: center;
  padding: 48px 24px;
  border: 2px dashed var(--pet-border, rgba(0,0,0,0.08));
  border-radius: 16px;
  margin: 8px 0;
}

.custom-empty.compact {
  padding: 32px 16px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: sparkleFloat 3s ease-in-out infinite;
}

@keyframes sparkleFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.05); }
}

.empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--pet-text, #2D2D2D);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 13px;
  color: var(--pet-text-tertiary, #9CA3AF);
  margin: 0;
}

/* ====== Dict Type Section ====== */
.dict-type-section {
  height: 100%;
}

.dict-type-tree-wrapper {
  max-height: 500px;
  overflow-y: auto;
  padding: 4px 0;
}

:deep(.dict-type-tree-wrapper .n-tree-node) {
  padding: 6px 8px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

:deep(.dict-type-tree-wrapper .n-tree-node:hover) {
  background: var(--pet-bg, #F3F4F6) !important;
}

:deep(.dict-type-tree-wrapper .n-tree-node--selected) {
  background: rgba(255, 155, 168, 0.1) !important;
}

:deep(.dict-type-tree-wrapper .n-tree-node-content__text) {
  font-size: 14px;
  font-weight: 500;
}

:deep(.dict-type-tree-wrapper .n-tree-node-switcher) {
  color: var(--pet-text-secondary, #8B8FA3);
}

/* ====== Dict Item Section ====== */
.dict-item-section {
  height: 100%;
}

.dict-item-tree-wrapper {
  max-height: 500px;
  overflow-y: auto;
  padding: 4px 0;
}

.dict-item-tree {
  min-height: 100px;
}

:deep(.dict-item-tree .n-tree-node) {
  padding: 6px 8px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

:deep(.dict-item-tree .n-tree-node:hover) {
  background: var(--pet-bg, #F3F4F6) !important;
}

:deep(.dict-item-tree .n-tree-node--selected) {
  background: rgba(255, 155, 168, 0.1) !important;
}

:deep(.dict-item-tree .n-tree-node-content__label) {
  font-size: 14px;
  font-weight: 500;
}

:deep(.dict-item-tree .n-tree-node-switcher) {
  color: var(--pet-text-secondary, #8B8FA3);
}

:deep(.dict-item-tree .n-tree-node-content__text) {
  font-size: 14px;
}

/* ====== Dark Theme ====== */
@media (prefers-color-scheme: dark) {
  :root:not(.light) .hero-inner {
    background: rgba(30, 30, 40, 0.85);
  }

  :root:not(.light) .hero-title .hero-title-text {
    background: linear-gradient(135deg, #FFB8C4 0%, #D4A5FF 50%, #A5B4FC 100%);
    -webkit-background-clip: text;
    background-clip: text;
  }

  :root:not(.light) .hero-subtitle {
    color: #9CA3AF;
  }

  :root:not(.light) .hero-stats-bar {
    background: rgba(30, 30, 40, 0.6);
    border-color: rgba(255, 155, 168, 0.1);
  }

  :root:not(.light) .hero-stat-value {
    color: #F3F4F6;
  }

  :root:not(.light) .hero-stat-label {
    color: #9CA3AF;
  }
}

html.dark .hero-inner {
  background: rgba(30, 30, 40, 0.85);
}

html.dark .hero-title .hero-title-text {
  background: linear-gradient(135deg, #FFB8C4 0%, #D4A5FF 50%, #A5B4FC 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

html.dark .hero-subtitle {
  color: #9CA3AF;
}

html.dark .hero-stats-bar {
  background: rgba(30, 30, 40, 0.6);
  border-color: rgba(255, 155, 168, 0.1);
}

html.dark .hero-stat-value {
  color: #F3F4F6;
}

html.dark .hero-stat-label {
  color: #9CA3AF;
}

html.dark .hero-shape {
  opacity: 0.12;
}

html.dark .tabs-header {
  background: #1E1E28;
  border-color: rgba(255, 255, 255, 0.06);
}

html.dark .tab-pill {
  color: #9CA3AF;
}

html.dark .tab-pill:hover {
  color: #F3F4F6;
  background: rgba(255, 255, 255, 0.04);
}

html.dark .section-card {
  background: #1E1E28;
  border-color: rgba(255, 255, 255, 0.06);
}

html.dark .section-card:hover {
  box-shadow: 0 4px 20px rgba(192, 132, 252, 0.08);
}

html.dark .section-card-title {
  color: #F3F4F6;
}

html.dark .empty-icon {
  filter: brightness(0.9);
}

html.dark .empty-title {
  color: #F3F4F6;
}

html.dark .empty-desc {
  color: #9CA3AF;
}

html.dark .custom-empty {
  border-color: rgba(255, 255, 255, 0.06);
}

html.dark .skeleton-cell {
  background: linear-gradient(90deg, #1E1E28 25%, #2A2A3A 50%, #1E1E28 75%);
  background-size: 200% 100%;
}

html.dark .skeleton-row {
  border-color: rgba(255, 255, 255, 0.04);
}

/* ====== Responsive ====== */
@media (max-width: 1200px) {
  .hero-inner {
    padding: 28px 24px 20px;
  }
  .hero-title {
    font-size: 28px;
  }
}

@media (max-width: 768px) {
  .hero-inner {
    padding: 24px 20px 18px;
  }
  .hero-title {
    font-size: 24px;
    gap: 8px;
  }
  .hero-title-icon {
    font-size: 28px;
  }
  .hero-stats-bar {
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px;
  }
  .hero-stat {
    padding: 0 12px;
  }
  .hero-stat-divider {
    display: none;
  }
  .tabs-header {
    width: 100%;
  }
  .tab-pill {
    flex: 1;
    text-align: center;
    padding: 8px 16px;
    font-size: 13px;
  }
  .section-card {
    padding: 16px;
    border-radius: 16px;
  }
  .section-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  :deep(.n-grid) {
    display: flex !important;
    flex-direction: column;
  }
  :deep(.n-gi) {
    width: 100% !important;
    min-width: 0 !important;
  }
}

@media (max-width: 480px) {
  .hero-inner {
    padding: 20px 16px 14px;
  }
  .hero-title {
    font-size: 20px;
  }
  .hero-title-icon {
    font-size: 24px;
  }
  .hero-subtitle {
    font-size: 12px;
  }
  .hero-stat-value {
    font-size: 18px;
  }
  .hero-stat-label {
    font-size: 11px;
  }
}
</style>
