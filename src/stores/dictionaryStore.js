// (这是 src/stores/dictionaryStore.js 的“模态框”升级版)

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import {
  fetchDictTypeList,
  fetchDictItemList,
  fetchDictItemsByCode,
  createDictItem // (❗ 新增)
} from '@/api.js';

// (❗ 新增)
const defaultDictItemForm = () => ({
  dictCode: '',
  itemLabel: '',
  itemValue: '',
  parentId: null,
  sortOrder: 0
});

export const useDictionaryStore = defineStore('dictionary', () => {

  // --- 1. State ---
  const dictTypeList = ref([]);
  const loadingTypes = ref(false);
  const dictItemList = ref([]);
  const loadingItems = ref(false);
  const species = ref([]);
  const breeds = ref([]);
  const healthEvents = ref([]);
  const loadingAppDicts = ref(false);

  // (❗ 新增) 字典项模态框的状态
  const itemFormModal = ref({
    show: false,
    isEdit: false,
    contextType: null, // (e.g., PET_BREED 对象)
    data: defaultDictItemForm(),
    loading: false
  });

  // --- 2. Computed ---
  const dictTypeTree = computed(() => {
    // ... (保持不变)
    const types = dictTypeList.value;
    const parents = types.filter(t => !t.parentCode);
    const children = types.filter(t => t.parentCode);
    return parents.map(p => ({
      ...p,
      children: children.filter(c => c.parentCode === p.dictCode) || []
    }));
  });

  // --- 3. Actions ---

  async function loadAllAppDictionaries() {
    // ... (保持不变)
    if (loadingAppDicts.value) return;
    loadingAppDicts.value = true;
    try {
      const [ typesRes, speciesRes, breedsRes, eventsRes ] = await Promise.all([
        fetchDictTypeList(),
        fetchDictItemsByCode('PET_SPECIES'),
        fetchDictItemsByCode('PET_BREED'),
        fetchDictItemsByCode('HEALTH_EVENT_TYPE')
      ]);
      dictTypeList.value = typesRes.data;
      species.value = speciesRes.data;
      breeds.value = breedsRes.data;
      healthEvents.value = eventsRes.data;
    } catch (err) {
      console.error("加载 App 核心字典失败:", err);
      alert("加载核心数据失败，请刷新页面。");
    } finally {
      loadingAppDicts.value = false;
    }
  }

  async function loadDictItems(dictCode) {
    // ... (保持不变)
    if (!dictCode) { dictItemList.value = []; return; }
    loadingItems.value = true;
    dictItemList.value = [];
    try {
      const response = await fetchDictItemList(dictCode);
      dictItemList.value = response.data;
    } catch (err) {
      console.error(`加载字典项 [${dictCode}] 失败:`, err);
      alert(`加载字典项 [${dictCode}] 失败`);
    } finally {
      loadingItems.value = false;
    }
  }

  // (❗ 新增) 模态框 Actions

  /**
   * (❗ 新增) (由 View 层调用) 打开模态框
   */
  function showDictItemModal(contextType, itemToEdit = null) {
    itemFormModal.value.contextType = contextType;
    if (itemToEdit) {
      // (编辑)
      itemFormModal.value.data = { ...itemToEdit };
      itemFormModal.value.isEdit = true;
    } else {
      // (创建)
      itemFormModal.value.data = defaultDictItemForm();
      itemFormModal.value.data.dictCode = contextType.dictCode; // (❗) 预设 dictCode
      itemFormModal.value.isEdit = false;
    }
    itemFormModal.value.show = true;
  }

  /**
   * (❗ 新增) (由组件调用) 保存表单
   */
  async function handleSaveItem(payload) {
    itemFormModal.value.loading = true;
    try {
      if (itemFormModal.value.isEdit) {
        // (TODO: 更新)
        // await updateDictItem(payload.id, payload);
      } else {
        // (创建)
        const response = await createDictItem(payload);
        alert(response.data);
      }

      itemFormModal.value.show = false; // (关闭)
      loadDictItems(payload.dictCode);  // (刷新右侧)
      loadAllAppDictionaries(); // (刷新全局)

    } catch (err) {
      console.error("保存字典项失败:", err);
      alert("保存字典项失败: " + (err.response?.data || err.message));
    } finally {
      itemFormModal.value.loading = false;
    }
  }

  function closeDictItemModal() {
    itemFormModal.value.show = false;
  }

  // --- 4. Return ---
  return {
    // State
    loadingTypes, dictItemList, loadingItems,
    species, breeds, healthEvents,
    itemFormModal, // (❗)

    // Computed
    dictTypeTree,

    // Actions
    loadAllAppDictionaries,
    loadDictItems,
    showDictItemModal, // (❗)
    handleSaveItem,    // (❗)
    closeDictItemModal // (❗)
  };
});
