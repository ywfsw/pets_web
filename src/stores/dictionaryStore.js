// (这是 src/stores/dictionaryStore.js 的“升级版”)

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

// (❗) 导入所有需要的 API
import {
  fetchDictTypeList,
  fetchDictItemList,
  fetchDictItemsByCode // (❗)
} from '@/api.js';

export const useDictionaryStore = defineStore('dictionary', () => {

  // --- 1. State (状态) ---
  const dictTypeList = ref([]);
  const loadingTypes = ref(false);
  const dictItemList = ref([]);
  const loadingItems = ref(false);

  // (❗ 新增) 全局字典 (用于宠物表单等)
  const species = ref([]);
  const breeds = ref([]);
  const healthEvents = ref([]);
  const loadingAppDicts = ref(false);

  // --- 2. Computed (计算属性) ---
  const dictTypeTree = computed(() => {
    const types = dictTypeList.value;
    const parents = types.filter(t => !t.parentCode);
    const children = types.filter(t => t.parentCode);
    return parents.map(p => ({
      ...p,
      children: children.filter(c => c.parentCode === p.dictCode) || []
    }));
  });

  // --- 3. Actions (动作) ---

  /**
   * (❗ 新增) 加载所有“App 核心字典”
   */
  async function loadAllAppDictionaries() {
    if (loadingAppDicts.value) return;
    loadingAppDicts.value = true;

    try {
      const [
        typesRes,
        speciesRes,
        breedsRes,
        eventsRes
      ] = await Promise.all([
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
    if (!dictCode) {
      dictItemList.value = [];
      return;
    }
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

  // --- 4. Return (暴露) ---
  return {
    // State
    loadingTypes,
    dictItemList,
    loadingItems,
    species,
    breeds,
    healthEvents,

    // Computed
    dictTypeTree,

    // Actions
    loadAllAppDictionaries, // (❗)
    loadDictItems
  };
});
