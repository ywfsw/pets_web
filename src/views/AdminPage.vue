<script setup>
import { ref, h, watch } from 'vue';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
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
  useMessage,
  NIcon
} from 'naive-ui';
import { PawOutline, BookOutline, Add } from '@vicons/ionicons5';

const dictStore = useDictionaryStore();
const petStore = usePetStore();
const authStore = useAuthStore();
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
  selectedDictType.value = type;
  if (type && type.dictCode) {
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
  } catch (err) {
    message.error('删除失败，请重试');
  }
};

const dictItemColumns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '标签 (Label)', key: 'itemLabel' },
  { title: '值 (Value)', key: 'itemValue' },
  { title: '父ID', key: 'parentId', width: 100 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render(row) {
      return h(NSpace, { size: 'small' }, () => [
        h(NButton, {
          size: 'small',
          onClick: () => handleEditDictItem(row)
        }, () => '编辑'),
        h(NPopconfirm, {
          onPositiveClick: () => handleDeleteDictItem(row)
        }, {
          trigger: () => h(NButton, { size: 'small', type: 'error' }, () => '删除'),
          default: () => `确定要删除 [${row.itemLabel}] 吗？`
        })
      ]);
    }
  }
];

// Watch for dictTypeTree data and select the first item if available
watch(() => dictStore.dictTypeTree, (newTree) => {
  if (newTree && newTree.length > 0 && currentTab.value === 'dictionaries') {
    const firstItem = newTree[0];
    selectedDictType.value = firstItem;
    dictStore.loadDictItems(firstItem.dictCode);
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
                  <n-button
                    @click="handleCreateItem"
                    type="primary"
                    size="small"
                    :disabled="!selectedDictType.dictCode"
                  >
                    添加字典项
                  </n-button>
                </template>
                <n-data-table
                  :columns="dictItemColumns"
                  :data="dictStore.dictItemList"
                  :row-key="row => row.id"
                  :bordered="false"
                />
                <n-text v-if="!selectedDictType.dictCode" depth="3" style="display: block; text-align: center; padding: 40px;">
                  请从左侧选择一个字典类型以查看其字典项。
                </n-text>
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
