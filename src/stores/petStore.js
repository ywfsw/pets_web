// (这是 src/stores/petStore.js 的“最终完整版”)

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useDictionaryStore } from './dictionaryStore'; // Import dictionary store
import { useAuthStore } from './authStore.js';

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
    updateHealthEvent,
    deleteHealthEvent,
    completeHealthEvent,
    createWeightLog,
    updateWeightLog,
    deleteWeightLog,
    getAllPetGallery, // New
    getPetGalleryByPetId,
    addPetGalleryImage,
    deletePetGalleryImage,
    uncompleteHealthEvent,
    createFeedingRecord,
    updateFeedingRecord,
    deleteFeedingRecord
  } from '@/api.js';
  
  // (❗) 宠物表单的默认值
  const defaultPetForm = () => ({
    id: null,
    name: '',
    birthday: null,
    speciesId: null,
    breedId: null,
    gender: null,
    notes: null
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
  const formatDate = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const defaultWeightLogForm = (petId) => ({
    petId: petId,
    weightKg: null,
    logDate: formatDate(new Date())
  });

  // 喂养记录表单的默认值
  const defaultFeedingRecordForm = (petId) => ({
    petId: petId,
    feedTime: Date.now(),
    foodType: '',
    amountGrams: null,
    notes: ''
  });
  
  export const usePetStore = defineStore('pet', () => {
    const dictStore = useDictionaryStore(); // Get instance of dictionary store
    const authStore = useAuthStore();
  
    // --- 1. State ---
    const activePage = ref('dashboard');
    const albumFilterPetId = ref(null);
    const albumFilterPetName = ref('');
    const timelinePetId = ref(null);
    const upcomingEvents = ref([]);
    const loadingUpcoming = ref(false);
    const searchKeyword = ref('');
    const speciesFilter = ref(null);
    const genderFilter = ref(null);

    // (❗) 分页状态
    const pagination = ref(defaultPagination());
    const loadingList = ref(false);
  
    // (❗) 排行榜状态
    const petLeaderboard = ref([]);
    const loadingLeaderboard = ref(false);

    // (❗) 相册状态
    const petGallery = ref([]);
    const loadingGallery = ref(false);
  
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
      isEdit: false,
      data: defaultHealthEventForm(null),
      loading: false
    });

    const weightLogFormModal = ref({
      show: false,
      isEdit: false,
      data: defaultWeightLogForm(null),
      loading: false
    });

    const feedingRecordFormModal = ref({
      show: false,
      isEdit: false,
      data: defaultFeedingRecordForm(null),
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const processedEvents = response.data.map((event) => {
          const dueDate = new Date(event.nextDueDate);
          dueDate.setHours(0, 0, 0, 0);
          const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          const isOverdue = daysLeft < 0;
          return {
            ...event,
            daysLeft,
            isOverdue
          };
        });
        // 按紧急度排序：今日到期 > 即将到期（天数升序） > 已过期（最近过期优先）
        processedEvents.sort((a, b) => {
          const priority = (e) => e.daysLeft === 0 ? 0 : e.daysLeft > 0 ? 1 : 2;
          const pa = priority(a);
          const pb = priority(b);
          if (pa !== pb) return pa - pb;
          if (pa === 2) return b.daysLeft - a.daysLeft;
          return a.daysLeft - b.daysLeft;
        });
        upcomingEvents.value = processedEvents;
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
        const params = {
          pageNum: pageNum,
          pageSize: pagination.value.size
        };
        if (searchKeyword.value && searchKeyword.value.trim()) {
          params.name = searchKeyword.value.trim();
        }
        if (speciesFilter.value) {
          params.speciesId = speciesFilter.value;
        }
        if (genderFilter.value) {
          params.gender = genderFilter.value;
        }
        const response = await fetchPetPage(params);
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
        const leaderboardData = response.data.map(pet => ({
          ...pet,
          profileImageUrl: pet.profileImageUrl // Ensure the correct property name is used
        }));
        petLeaderboard.value = leaderboardData;
      } catch (err) {
        console.error("加载宠物排行榜失败:", err);
      } finally {
        loadingLeaderboard.value = false;
      }
    }

    async function loadAllPetGallery() {
      if (loadingGallery.value) return;
      loadingGallery.value = true;
      try {
        const response = await getAllPetGallery();
        petGallery.value = response.data;
      } catch (err) {
        console.error("加载所有宠物相册失败:", err);
        petGallery.value = [];
      } finally {
        loadingGallery.value = false;
      }
    }

    async function loadPetGalleryByPetId(petId) {
      if (loadingGallery.value) return;
      loadingGallery.value = true;
      try {
        const response = await getPetGalleryByPetId(petId);
        petGallery.value = response.data;
      } catch (err) {
        console.error("加载宠物相册失败:", err);
        petGallery.value = [];
      } finally {
        loadingGallery.value = false;
      }
    }

    async function addPetGallery(imageData) {
      try {
        await addPetGalleryImage(imageData);
        // 根据当前筛选状态刷新
        if (albumFilterPetId.value) {
          await loadPetGalleryByPetId(albumFilterPetId.value);
        } else {
          await loadAllPetGallery();
        }
      } catch (err) {
        console.error("添加宠物图片失败:", err);
      }
    }

    async function deletePetGallery(imageId) {
      try {
        await deletePetGalleryImage(imageId);
        // 根据当前筛选状态刷新
        if (albumFilterPetId.value) {
          await loadPetGalleryByPetId(albumFilterPetId.value);
        } else {
          await loadAllPetGallery();
        }
      } catch (err) {
        console.error("删除宠物图片失败:", err);
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
     * (❗) 动作: 点赞 (乐观更新 + 不等待响应)
     */
    async function handleLike(petId) {
      const pet = pagination.value.records.find(p => p.id === petId);
      if (!pet) return;

      // 立即增加计数（乐观更新）
      pet.likeCount++;

      // 发送请求但不等待，允许连点
      likePet(petId).catch(err => {
        // 请求失败，回滚计数
        pet.likeCount--;
        console.error("点赞失败:", err);
      });
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
      // 检查是否登录
      if (!authStore.isAuthenticated) {
        throw new Error('请先登录后再操作');
      }

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
                await createPet(payload);
              }
              closeAllPetModals();
        loadPetList(currentPage.value); // (❗) 刷新当前页
      } catch (err) {
        console.error("保存宠物失败:", err);
        throw err;
      } finally {
        petFormModal.value.loading = false;
      }
    }
  
    function showHealthEventFormModal(petId, eventToEdit = null) {
      if (eventToEdit) {
        healthEventFormModal.value.data = {
          id: eventToEdit.id,
          petId: petId,
          eventTypeId: eventToEdit.eventTypeId,
          eventDate: eventToEdit.eventDate ? new Date(eventToEdit.eventDate).getTime() : Date.now(),
          notes: eventToEdit.notes || '',
          nextDueDate: eventToEdit.nextDueDate ? new Date(eventToEdit.nextDueDate).getTime() : null
        };
        healthEventFormModal.value.isEdit = true;
      } else {
        healthEventFormModal.value.data = defaultHealthEventForm(petId);
        healthEventFormModal.value.isEdit = false;
      }
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
        if (healthEventFormModal.value.isEdit && payload.id) {
          await updateHealthEvent(payload.id, payload);
        } else {
          await createHealthEvent(payload);
        }
        closeHealthEventFormModal();
        loadPetDetail(payload.petId); // Refresh pet details to show new event
      } catch (err) {
        console.error("保存健康事件失败:", err);
        throw err;
      } finally {
        healthEventFormModal.value.loading = false;
      }
    }
  
    function closeHealthEventFormModal() {
      healthEventFormModal.value.show = false;
    }

    function showWeightLogFormModal(petId, logToEdit = null) {
      if (logToEdit) {
        weightLogFormModal.value.data = {
          id: logToEdit.id,
          petId: petId,
          weightKg: logToEdit.weightKg,
          logDate: logToEdit.logDate ? formatDate(logToEdit.logDate) : formatDate(new Date())
        };
        weightLogFormModal.value.isEdit = true;
      } else {
        weightLogFormModal.value.data = defaultWeightLogForm(petId);
        weightLogFormModal.value.isEdit = false;
      }
      weightLogFormModal.value.show = true;
    }

    async function handleSaveWeightLog() {
      weightLogFormModal.value.loading = true;
      const payload = { ...weightLogFormModal.value.data };

      // logDate is already a yyyy-MM-dd string, compatible with backend LocalDate

      try {
        if (weightLogFormModal.value.isEdit && payload.id) {
          await updateWeightLog(payload.id, payload);
        } else {
          await createWeightLog(payload);
        }
        closeWeightLogFormModal();
        loadPetDetail(payload.petId); // Refresh pet details to show new log
      } catch (err) {
        console.error("保存体重记录失败:", err);
        throw err;
      } finally {
        weightLogFormModal.value.loading = false;
      }
    }

    function closeWeightLogFormModal() {
      weightLogFormModal.value.show = false;
    }

    // 喂养记录
    function showFeedingRecordFormModal(petId, recordToEdit = null) {
      if (recordToEdit) {
        feedingRecordFormModal.value.data = {
          id: recordToEdit.id,
          petId: petId,
          feedTime: recordToEdit.feedTime ? new Date(recordToEdit.feedTime).getTime() : Date.now(),
          foodType: recordToEdit.foodType || '',
          amountGrams: recordToEdit.amountGrams,
          notes: recordToEdit.notes || ''
        };
        feedingRecordFormModal.value.isEdit = true;
      } else {
        feedingRecordFormModal.value.data = defaultFeedingRecordForm(petId);
        feedingRecordFormModal.value.isEdit = false;
      }
      feedingRecordFormModal.value.show = true;
    }

    async function handleSaveFeedingRecord() {
      feedingRecordFormModal.value.loading = true;
      const payload = { ...feedingRecordFormModal.value.data };
      if (typeof payload.feedTime === 'number') {
        payload.feedTime = new Date(payload.feedTime).toISOString();
      }
      try {
        if (feedingRecordFormModal.value.isEdit && payload.id) {
          await updateFeedingRecord(payload.id, payload);
        } else {
          await createFeedingRecord(payload);
        }
        closeFeedingRecordFormModal();
        loadPetDetail(payload.petId);
      } catch (err) {
        console.error("保存喂养记录失败:", err);
        throw err;
      } finally {
        feedingRecordFormModal.value.loading = false;
      }
    }

    async function handleDeleteFeedingRecord(recordId) {
      const petId = detailModal.value.data?.id;
      try {
        await deleteFeedingRecord(recordId);
        if (petId) {
          await loadPetDetail(petId);
        }
      } catch (err) {
        console.error("删除喂养记录失败:", err);
        throw err;
      }
    }

    function closeFeedingRecordFormModal() {
      feedingRecordFormModal.value.show = false;
    }

    // 删除体重记录
    async function handleDeleteWeightLog(logId) {
      const petId = detailModal.value.data?.id;
      try {
        await deleteWeightLog(logId);
        // 刷新宠物详情
        if (petId) {
          await loadPetDetail(petId);
        }
      } catch (err) {
        console.error("删除体重记录失败:", err);
        throw err;
      }
    }

    // 删除健康事件
    async function handleDeleteHealthEvent(eventId) {
      const petId = detailModal.value.data?.id;
      try {
        await deleteHealthEvent(eventId);
        // 刷新宠物详情
        if (petId) {
          await loadPetDetail(petId);
        }
      } catch (err) {
        console.error("删除健康事件失败:", err);
        throw err;
      }
    }

    // 标记健康事件为已完成
    async function handleCompleteHealthEvent(eventId) {
      try {
        await completeHealthEvent(eventId);
        // 刷新宠物详情
        const petId = detailModal.value.data?.id;
        if (petId) {
          await loadPetDetail(petId);
        }
        // 刷新提醒列表
        await loadUpcomingEvents();
      } catch (err) {
        console.error("标记事件完成失败:", err);
        throw err;
      }
    }

    // 撤销健康事件的已完成状态
    async function handleUncompleteHealthEvent(eventId) {
      try {
        await uncompleteHealthEvent(eventId);
        const petId = detailModal.value.data?.id;
        if (petId) {
          await loadPetDetail(petId);
        }
        await loadUpcomingEvents();
      } catch (err) {
        console.error("撤销事件完成失败:", err);
        throw err;
      }
    }

    function closeAllPetModals() {
      detailModal.value.show = false;
      petFormModal.value.show = false;
      healthEventFormModal.value.show = false;
      weightLogFormModal.value.show = false;
      feedingRecordFormModal.value.show = false;
    }

    function setSearchKeyword(keyword) {
      searchKeyword.value = keyword;
      loadPetList(1);
    }

    function clearSearchKeyword() {
      searchKeyword.value = '';
      loadPetList(1);
    }

    function setSpeciesFilter(value) {
      speciesFilter.value = value;
      loadPetList(1);
    }

    function clearSpeciesFilter() {
      speciesFilter.value = null;
      loadPetList(1);
    }

    function setGenderFilter(value) {
      genderFilter.value = value;
      loadPetList(1);
    }

    function clearGenderFilter() {
      genderFilter.value = null;
      loadPetList(1);
    }

    function navigateToAlbum(petId = null, petName = '') {
      albumFilterPetId.value = petId;
      albumFilterPetName.value = petName;
      activePage.value = 'pet-album';
    }

    function navigateToTimeline(petId = null) {
      timelinePetId.value = petId;
      activePage.value = 'timeline';
    }

    function clearAlbumFilter() {
      albumFilterPetId.value = null;
      albumFilterPetName.value = '';
      loadAllPetGallery();
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
      activePage,
      albumFilterPetId,
      albumFilterPetName,
      timelinePetId,
      searchKeyword,
      speciesFilter,
      genderFilter,
      upcomingEvents, loadingUpcoming,
      loadingList,
      detailModal,
      petFormModal,
      healthEventFormModal, // (❗)
      weightLogFormModal, // (❗)
      feedingRecordFormModal,
      pagination,
      petLeaderboard, // (❗)
      loadingLeaderboard, // (❗)
      petGallery,
      loadingGallery,

      // Computed
      petList,
      totalPages,
      currentPage,

      // Actions
      loadUpcomingEvents,
      loadPetList,
      loadPetLeaderboard, // (❗)
      loadAllPetGallery,
      loadPetGalleryByPetId,
      addPetGallery,
      deletePetGallery,
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
      showFeedingRecordFormModal,
      handleSaveFeedingRecord,
      handleDeleteFeedingRecord,
      closeFeedingRecordFormModal,
      handleDeleteWeightLog,
      handleDeleteHealthEvent,
      handleCompleteHealthEvent,
      handleUncompleteHealthEvent,
      setSearchKeyword,
      clearSearchKeyword,
      setSpeciesFilter,
      clearSpeciesFilter,
      setGenderFilter,
      clearGenderFilter,
      switchToEditMode,
      handleDeletePet, // (❗)
      navigateToAlbum,
      clearAlbumFilter,
      navigateToTimeline
    };
  });
