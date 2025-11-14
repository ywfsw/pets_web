<script setup>
import { ref } from 'vue';

import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { usePetStore } from '@/stores/petStore.js';

import DictTypeTree from '@/components/DictTypeTree.vue';
import DictItemFormModal from '@/components/DictItemFormModal.vue';

const dictStore = useDictionaryStore();
const petStore = usePetStore();

const currentTab = ref('pets');

// (宠物 Handlers)
const handleCreatePet = () => { petStore.showPetFormModal(null); };
const handleShowDetail = (petId) => { petStore.showDetailModal(petId); };
const handleEditPet = (pet) => { petStore.showPetFormModal(pet); };

/**
 * (❗❗❗ 核心升级 ❗❗❗)
 * (实现删除逻辑)
 */
const handleDeletePet = (petId, petName) => {
  // (1. 友好确认)
  if (confirm(`确定要删除宠物 [${petName}] 吗？`)) {
    // (2. 调用 Store)
    petStore.handleDeletePet(petId);
  }
};

// (字典 Handlers ... 保持不变)
const selectedDictType = ref(null);
const onTypeSelect = (type) => {
  selectedDictType.value = type;
  dictStore.loadDictItems(type.dictCode);
};
const handleCreateItem = () => {
  dictStore.showDictItemModal(selectedDictType.value, null);
};

</script>
