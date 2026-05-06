<script setup>
import { ref, h, watch, computed } from 'vue';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { usePetStore } from '@/stores/petStore.js';
import DictTypeTree from '@/components/DictTypeTree.vue';
import {
  NTabs,
  NTabPane,
  NGrid,
  NGi,
  NCard,
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  NTree,
  NEmpty,
  NSpin,
  useMessage,
  NIcon
} from 'naive-ui';
import { PawOutline, BookOutline, Add } from '@vicons/ionicons5';

const dictStore = useDictionaryStore();
const petStore = usePetStore();
const message = useMessage();

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
  <div class="admin-page">
    <!-- 页面标题 -->
    <div class="admin-header">
      <h2 class="admin-title">
        <n-icon :component="PawOutline" size="28" color="#FF9BA8" />
        后台管理
      </h2>
    </div>

    <n-card class="admin-card">
      <n-tabs type="line" animated v-model:value="currentTab" size="large">
        <n-tab-pane name="pets" tab="宠物管理">
          <template #tab>
            <n-space align="center" :size="8">
              <n-icon :component="PawOutline" />
              <span>宠物管理</span>
            </n-space>
          </template>
          <n-card class="inner-card" :bordered="false">
            <template #header>
              <n-space align="center" justify="space-between">
                <span class="section-title">宠物列表</span>
                <n-button @click="handleCreatePet" type="primary" class="add-btn">
                  <template #icon>
                    <n-icon><Add /></n-icon>
                  </template>
                  添加新宠物
                </n-button>
              </n-space>
            </template>
            <n-data-table
              :columns="petTableColumns"
              :data="petStore.petList"
              :loading="petStore.loadingList"
              :pagination="{ page: petStore.currentPage, pageCount: petStore.totalPages, itemCount: petStore.pagination.total }"
              :remote="true"
              @update:page="petStore.loadPetList"
              :row-key="row => row.id"
              :bordered="false"
            />
          </n-card>
        </n-tab-pane>

        <n-tab-pane name="dictionaries" tab="字典管理">
          <template #tab>
            <n-space align="center" :size="8">
              <n-icon :component="BookOutline" />
              <span>字典管理</span>
            </n-space>
          </template>
          <n-grid :x-gap="24" :y-gap="24" :cols="3">
            <n-gi :span="1">
              <n-card title="字典类型" :loading="dictStore.loadingTypes" class="dict-type-card">
                <DictTypeTree
                  :treeData="dictStore.dictTypeTree"
                  v-model:selectedCode="selectedDictType.dictCode"
                  @select="onTypeSelect"
                />
              </n-card>
            </n-gi>
            <n-gi :span="2">
              <n-card :loading="dictStore.loadingItems" class="dict-item-card">
                <template #header>
                  <span v-if="selectedDictType.dictCode">字典项 ({{ selectedDictType.dictCode }})</span>
                  <span v-else>字典项</span>
                </template>
                <template #header-extra>
                  <n-space :size="8">
                    <n-button
                      v-if="getSelectedItem()"
                      size="small"
                      quaternary
                      type="info"
                      @click="handleEditDictItem(getSelectedItem())"
                    >
                      编辑选中
                    </n-button>
                    <n-popconfirm
                      v-if="getSelectedItem()"
                      @positive-click="handleDeleteDictItem(getSelectedItem())"
                    >
                      <template #trigger>
                        <n-button size="small" quaternary type="error">删除选中</n-button>
                      </template>
                      确定要删除 [{{ getSelectedItem()?.itemLabel }}] 吗？
                    </n-popconfirm>
                    <n-button
                      @click="handleCreateItem"
                      type="primary"
                      size="small"
                      :disabled="!selectedDictType.dictCode"
                    >
                      添加字典项
                    </n-button>
                  </n-space>
                </template>
                <n-spin :show="dictStore.loadingItems">
                  <n-tree
                    v-if="dictItemTreeData.length > 0"
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
                  <n-empty
                    v-else-if="selectedDictType.dictCode && !dictStore.loadingItems"
                    description="该字典类型下暂无字典项"
                    style="padding: 40px 0;"
                  />
                  <n-empty
                    v-else-if="!selectedDictType.dictCode"
                    description="请从左侧选择一个字典类型以查看其字典项"
                    style="padding: 40px 0;"
                  />
                </n-spin>
              </n-card>
            </n-gi>
          </n-grid>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<style scoped>
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面头部 */
.admin-header {
  margin-bottom: 24px;
}

.admin-title {
  font-size: 28px;
  font-weight: 700;
  color: #2D2D2D;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 卡片样式 */
.admin-card {
  border-radius: 20px;
  background: var(--pet-card);
  border: 1px solid var(--pet-border);
}

.inner-card {
  background: var(--pet-bg-secondary);
  border-radius: 16px;
  margin-top: 16px;
}

.dict-type-card, .dict-item-card {
  border-radius: 16px;
}

.section-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--pet-text);
}

/* 添加按钮 */
.add-btn {
  background: linear-gradient(135deg, var(--pet-primary) 0%, var(--pet-primarySuppl) 100%) !important;
  border: none !important;
  border-radius: 16px !important;
  font-weight: 600;
}

/* 表格样式 */
:deep(.n-data-table-th) {
  background: var(--pet-bg-secondary) !important;
  font-weight: 600;
}

:deep(.n-data-table-tr:hover) {
  background: var(--pet-bg) !important;
}

/* 字典项树形样式 */
.dict-item-tree {
  min-height: 200px;
}

:deep(.dict-item-tree .n-tree-node) {
  padding: 6px 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

:deep(.dict-item-tree .n-tree-node:hover) {
  background: var(--pet-bg) !important;
}

:deep(.dict-item-tree .n-tree-node--selected) {
  background: rgba(255, 155, 168, 0.12) !important;
}

:deep(.dict-item-tree .n-tree-node-content__label) {
  font-size: 14px;
}

:deep(.dict-item-tree .n-tree-node-switcher) {
  color: var(--pet-text-secondary);
}

/* 响应式 */
@media (max-width: 768px) {
  .admin-title {
    font-size: 22px;
  }

  :deep(.n-grid) {
    display: flex;
    flex-direction: column;
  }

  :deep(.n-gi) {
    width: 100% !important;
  }
}
</style>
