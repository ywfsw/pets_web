// (这是 src/stores/petStore.js 的“最终完整版”)

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useDictionaryStore } from './dictionaryStore'; // Import dictionary store

// (❗) 导入所有需要的 API
import {
  fetchPetPage,
    fetchUpcomingEvents,
    likePet,
    fetchPetDetail,
    createPet,
    updatePet,
    deletePet,
    fetchPetLeaderboard,
    createHealthEvent,
    createWeightLog // (❗)
  } from '@/api.js';
  
  // (❗) 宠物表单的默认值
  const defaultPetForm = () => ({
    id: null,
    name: '',
    birthday: '',
    speciesId: null,
    breedId: null
  });
  
  // (❗) MP IPage 的默认状态
  const defaultPagination = () => ({
    records: [],
    total: 0,   // (总记录数)
    size: 10,   // (每页条数)
    current: 1, // (当前页码)
    pages: 0    // (总页数)
  });
  
  // (❗) 健康事件表单的默认值
  const defaultHealthEventForm = (petId) => ({
    petId: petId,
    eventTypeId: null,
    eventDate: Date.now(), // Default to today
    notes: '',
    nextDueDate: null
  });

  // (❗) 体重记录表单的默认值
  const defaultWeightLogForm = (petId) => ({
    petId: petId,
    weightKg: null,
    logDate: Date.now() // Default to today
  });
  
  export const usePetStore = defineStore('pet', () => {
    const dictStore = useDictionaryStore(); // Get instance of dictionary store
  
    // --- 1. State ---
    const upcomingEvents = ref([]);
    const loadingUpcoming = ref(false);
    const likingPetIds = ref(new Set());
  
    // (❗) 分页状态
    const pagination = ref(defaultPagination());
    const loadingList = ref(false);
  
    // (❗) 排行榜状态
    const petLeaderboard = ref([]);
    const loadingLeaderboard = ref(false);
  
    // (模态框状态)
    const detailModal = ref({
      show: false,
      petId: null,
      data: null,
      loading: false
    });
  
    const petFormModal = ref({
      show: false,
      isEdit: false,
      data: defaultPetForm(),
      loading: false
    });

    const healthEventFormModal = ref({
      show: false,
      data: defaultHealthEventForm(null),
      loading: false
    });

    const weightLogFormModal = ref({
      show: false,
      data: defaultWeightLogForm(null),
      loading: false
    });
  
    // --- 2. Computed (计算属性) ---
  
    const petList = computed(() => pagination.value.records);
    const totalPages = computed(() => pagination.value.pages);
    const currentPage = computed(() => pagination.value.current);
  
    // --- 3. Actions ---
  
    async function loadUpcomingEvents() {
      if (loadingUpcoming.value) return;
      loadingUpcoming.value = true;
      try {
        const response = await fetchUpcomingEvents();
        const eventsWithPetNames = await Promise.all(
          response.data.map(async (event) => {
            const petDetail = await fetchPetDetail(event.petId);
            return { ...event, petName: petDetail.data.name };
          })
        );
        upcomingEvents.value = eventsWithPetNames;
      } catch (err) { console.error("加载提醒事件失败:", err); }
      finally { loadingUpcoming.value = false; }
    }
  
    /**
     * (❗) 加载宠物列表 (分页)
     */
    async function loadPetList(pageNum = 1) {
      if (loadingList.value) return;
      loadingList.value = true;
      try {
        const response = await fetchPetPage({
          pageNum: pageNum,
          pageSize: pagination.value.size
        });
        const enrichedRecords = response.data.records.map(pet => {
          const species = dictStore.species.find(s => s.id === pet.speciesId);
          const breed = dictStore.breeds.find(b => b.id === pet.breedId);
          return {
            ...pet,
            speciesLabel: species ? species.itemLabel : '未知物种',
            breedLabel: breed ? breed.itemLabel : '未知品种'
          };
        });
        pagination.value = { ...response.data, records: enrichedRecords };
      } catch (err) {
        console.error("加载宠物列表失败:", err);
      } finally {
        loadingList.value = false;
      }
    }
  
    /**
     * (❗) 加载宠物点赞排行榜
     */
    async function loadPetLeaderboard() {
      if (loadingLeaderboard.value) return;
      loadingLeaderboard.value = true;
      try {
        const response = await fetchPetLeaderboard(3); // Fetch only top 3
        const leaderboardData = response.data;

        // Fetch avatarUrl for each pet in the leaderboard
        const detailedLeaderboard = await Promise.all(
          leaderboardData.map(async (pet) => {
            const detailResponse = await fetchPetDetail(pet.petId);
            return { ...pet, avatarUrl: detailResponse.data.avatarUrl };
          })
        );
        petLeaderboard.value = detailedLeaderboard;
      } catch (err) {
        console.error("加载宠物排行榜失败:", err);
      } finally {
        loadingLeaderboard.value = false;
      }
    }
  
    /**
     * (❗) 分页动作
     */
    function goToNextPage() {
      if (currentPage.value < totalPages.value) {
        loadPetList(currentPage.value + 1);
      }
    }
    function goToPrevPage() {
      if (currentPage.value > 1) {
        loadPetList(currentPage.value - 1);
      }
    }
  
    /**
     * (❗) 动作: 点赞 (乐观更新)
     */
    async function handleLike(petId) {
      if (likingPetIds.value.has(petId)) return;
      const pet = pagination.value.records.find(p => p.id === petId); // (❗)
      if (!pet) return;
      likingPetIds.value.add(petId);
      pet.likeCount++;
      try {
        await likePet(petId);
      } catch (err) {
        pet.likeCount--;
        console.error("点赞失败:", err);
      } finally {
        setTimeout(() => { likingPetIds.value.delete(petId); }, 400);
      }
    }
  
    // --- 模态框 Actions ---
  
    async function loadPetDetail(petId) {
      detailModal.value.loading = true;
      try {
        const response = await fetchPetDetail(petId);
        detailModal.value.data = response.data;
      } catch (err) {
        console.error("加载宠物详情失败:", err);
        detailModal.value.show = false;
      } finally {
        detailModal.value.loading = false;
      }
    }
  
    function showDetailModal(petId) {
      detailModal.value.petId = petId;
      detailModal.value.data = null;
      detailModal.value.show = true;
      loadPetDetail(petId);
    }
  
    function showPetFormModal(petToEdit = null) {
      // (❗) petToEdit 是从 pagination.records 来的
      if (petToEdit) {
        petFormModal.value.data = { ...petToEdit };
        petFormModal.value.isEdit = true;
      } else {
        petFormModal.value.data = defaultPetForm();
        petFormModal.value.isEdit = false;
      }
      petFormModal.value.show = true;
    }
  
    /**
     * (❗) 动作: 保存 (创建/更新)
     */
    async function handleSavePet() {
      petFormModal.value.loading = true;
  
      // (❗ O_1183 修复)
            const { isEdit, data } = petFormModal.value;
            const payload = { ...data };
      
            // Convert birthday timestamp to ISO 8601 string if it's a number
            if (typeof payload.birthday === 'number') {
              payload.birthday = new Date(payload.birthday).toISOString();
            }
      
            try {
              if (isEdit) {
                await updatePet(payload.id, payload);
              } else {
                const response = await createPet(payload);
                alert(response.data);
              }        closeAllPetModals();
        loadPetList(currentPage.value); // (❗) 刷新当前页
      } catch (err) {
        console.error("保存宠物失败:", err);
      } finally {
        petFormModal.value.loading = false;
      }
    }
  
    function showHealthEventFormModal(petId) {
      healthEventFormModal.value.data = defaultHealthEventForm(petId);
      healthEventFormModal.value.show = true;
    }

    async function handleSaveHealthEvent() {
      healthEventFormModal.value.loading = true;
      const payload = { ...healthEventFormModal.value.data };

      // Convert date timestamps to ISO 8601 strings
      if (typeof payload.eventDate === 'number') {
        payload.eventDate = new Date(payload.eventDate).toISOString();
      }
      if (typeof payload.nextDueDate === 'number') {
        payload.nextDueDate = new Date(payload.nextDueDate).toISOString();
      }

      try {
        await createHealthEvent(payload);
        closeHealthEventFormModal();
        loadPetDetail(payload.petId); // Refresh pet details to show new event
      } catch (err) {
        console.error("保存健康事件失败:", err);
      } finally {
        healthEventFormModal.value.loading = false;
      }
    }
  
    function closeHealthEventFormModal() {
      healthEventFormModal.value.show = false;
    }

    function showWeightLogFormModal(petId) {
      weightLogFormModal.value.data = defaultWeightLogForm(petId);
      weightLogFormModal.value.show = true;
    }

    async function handleSaveWeightLog() {
      weightLogFormModal.value.loading = true;
      const payload = { ...weightLogFormModal.value.data };

      // Convert logDate timestamp to ISO 8601 string
      if (typeof payload.logDate === 'number') {
        payload.logDate = new Date(payload.logDate).toISOString();
      }

      try {
        await createWeightLog(payload);
        closeWeightLogFormModal();
        loadPetDetail(payload.petId); // Refresh pet details to show new log
      } catch (err) {
        console.error("保存体重记录失败:", err);
      } finally {
        weightLogFormModal.value.loading = false;
      }
    }

    function closeWeightLogFormModal() {
      weightLogFormModal.value.show = false;
    }

    function closeAllPetModals() {
      detailModal.value.show = false;
      petFormModal.value.show = false;
      healthEventFormModal.value.show = false;
      weightLogFormModal.value.show = false;
    }
  
    function switchToEditMode() {
      const petId = detailModal.value.petId;
      if (!petId) return;
      const petFromList = pagination.value.records.find(p => p.id === petId);
      if (!petFromList) {
        alert("错误：在列表中找不到宠物。");
        return;
      }
      closeAllPetModals();
      showPetFormModal(petFromList);
    }
  
    /**
     * (❗ O_1185 修复)
     * 动作: 删除宠物 (乐观更新)
     */
    async function handleDeletePet(petId) {
      if (!petId) return;
  
      const index = pagination.value.records.findIndex(p => p.id === petId);
      if (index === -1) {
        console.error("在列表中找不到要删除的 pet:", petId);
        return;
      }
  
      const petToRemove = pagination.value.records[index];
  
      // (❗) 乐观删除
      pagination.value.records.splice(index, 1);
      pagination.value.total--;
  
      try {
        // (调用 API)
        await deletePet(petId);
  
        // (成功: 刷新总数, 确保分页正确)
        // (如果删的是最后一页的最后一条, 我们需要重新加载)
        if (pagination.value.records.length === 0 && pagination.value.current > 1) {
          loadPetList(pagination.value.current - 1);
        } else {
          // (如果当前页还有数据, 相信乐观更新)
        }
  
      } catch (err) {
        // (❗) API 失败, 必须回滚
        console.error("删除宠物失败:", err);
  
        // (把删除的宠物“加回去”)
        pagination.value.records.splice(index, 0, petToRemove);
        pagination.value.total++;
      }
    }
  
    // --- 3. Return ---
    return {
      // State
      upcomingEvents, loadingUpcoming,
      loadingList,
      likingPetIds,
      detailModal,
      petFormModal,
      healthEventFormModal, // (❗)
      weightLogFormModal, // (❗)
      pagination,
      petLeaderboard, // (❗)
      loadingLeaderboard, // (❗)
  
      // Computed
      petList,
      totalPages,
      currentPage,
  
      // Actions
      loadUpcomingEvents,
      loadPetList,
      loadPetLeaderboard, // (❗)
      goToNextPage,
      goToPrevPage,
      handleLike,
      showDetailModal,
      showPetFormModal,
      handleSavePet,
      showHealthEventFormModal, // (❗)
      handleSaveHealthEvent, // (❗)
      closeAllPetModals,
      closeHealthEventFormModal, // (❗)
      showWeightLogFormModal, // (❗)
      handleSaveWeightLog, // (❗)
      closeWeightLogFormModal, // (❗)
      switchToEditMode,
      handleDeletePet // (❗)
    };
  });
