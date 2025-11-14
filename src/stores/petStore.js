// (这是 src/stores/petStore.js 的内容)

import { ref } from 'vue';
import { defineStore } from 'pinia';

// (❗) 导入我们刚添加的“API”
import { fetchPetPage, fetchUpcomingEvents } from '@/api.js';

// (❗) 定义一个叫 'pet' 的 store (仓库)
export const usePetStore = defineStore('pet', () => {

  // --- 1. State (状态) ---
  // (这对应你旧 index.html 里的 upcomingEvents 和 petList)
  const upcomingEvents = ref([]);
  const loadingUpcoming = ref(false);

  const petList = ref([]);
  const loadingList = ref(false);

  // (TODO: 分页状态)
  // const pagination = ref({ current: 1, size: 10, total: 0 });

  // --- 2. Actions (动作) ---

  /**
   * (❗) 加载即将到期的事件
   */
  async function loadUpcomingEvents() {
    if (loadingUpcoming.value) return;
    loadingUpcoming.value = true;
    try {
      const response = await fetchUpcomingEvents();
      upcomingEvents.value = response.data;
    } catch (err) {
      console.error("加载提醒事件失败:", err);
      // (这个失败通常不致命, 不弹 alert)
    } finally {
      loadingUpcoming.value = false;
    }
  }

  /**
   * (❗) 加载宠物列表
   */
  async function loadPetList() {
    if (loadingList.value) return;
    loadingList.value = true;
    try {
      // (暂时写死第一页)
      const response = await fetchPetPage({ pageNum: 1, pageSize: 10 });
      petList.value = response.data.records;
      // pagination.value.total = response.data.total;
    } catch (err) {
      console.error("加载宠物列表失败:", err);
      alert("加载宠物列表失败，请刷新页面。");
    } finally {
      loadingList.value = false;
    }
  }

  // --- 3. Return (暴露) ---
  return {
    // State
    upcomingEvents,
    loadingUpcoming,
    petList,
    loadingList,

    // Actions
    loadUpcomingEvents,
    loadPetList
  };
});
