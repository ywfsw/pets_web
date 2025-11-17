<script setup>
import { ref, h, watch } from 'vue';
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
  useMessage,
} from 'naive-ui';

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
  { title: '名字', key: 'name' },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, null, () => [
        h(NButton, { size: 'small', onClick: () => handleEditPet(row) }, () => '编辑'),
        h(NPopconfirm, { onPositiveClick: () => handleDeletePet(row.id) }, {
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
  if (type && type.dictCode) { // Ensure type and dictCode exist
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

const dictItemColumns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '标签 (Label)', key: 'itemLabel' },
  { title: '值 (Value)', key: 'itemValue' },
  { title: '父ID', key: 'parentId', width: 100 },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, null, () => [
        h(NButton, { size: 'small', onClick: () => handleEditDictItem(row) }, () => '编辑'),
        h(NPopconfirm, { onPositiveClick: () => message.info('删除功能待开发') }, {
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
    // Select the first top-level item
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
  <n-tabs type="line" animated v-model:value="currentTab">
    <n-tab-pane name="pets" tab="宠物管理">
      <n-card title="宠物列表 (后台)">
        <template #header-extra>
          <n-button @click="handleCreatePet" type="primary">添加新宠物</n-button>
        </template>
        <n-data-table
          :columns="petTableColumns"
          :data="petStore.petList"
          :loading="petStore.loadingList"
          :pagination="{ page: petStore.currentPage, pageCount: petStore.totalPages, itemCount: petStore.pagination.total }"
          :remote="true"
          @update:page="petStore.loadPetList"
          :row-key="row => row.id"
        />
      </n-card>
    </n-tab-pane>

    <n-tab-pane name="dictionaries" tab="字典管理">
      <n-grid :x-gap="24" :y-gap="24" :cols="3">
        <n-gi :span="1">
          <n-card title="字典类型 (只读)" :loading="dictStore.loadingTypes">
            <DictTypeTree
              :treeData="dictStore.dictTypeTree"
              v-model:selectedCode="selectedDictType.dictCode"
              @select="onTypeSelect"
            />
          </n-card>
        </n-gi>
        <n-gi :span="2">
          <n-card :loading="dictStore.loadingItems">
            <template #header>
              <span v-if="selectedDictType.dictCode">字典项 ({{ selectedDictType.dictCode }})</span>
              <span v-else>字典项</span>
            </template>
            <template #header-extra>
              <n-button @click="handleCreateItem" type="primary" :disabled="!selectedDictType.dictCode">
                添加字典项
              </n-button>
            </template>
            <n-data-table
              :columns="dictItemColumns"
              :data="dictStore.dictItemList"
              :row-key="row => row.id"
            />
            <n-text v-if="!selectedDictType.dictCode" depth="3">请从左侧选择一个字典类型以查看其字典项。</n-text>
          </n-card>
        </n-gi>
      </n-grid>
    </n-tab-pane>
  </n-tabs>
</template>
