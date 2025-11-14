<script setup>
import { ref, onMounted, watch } from 'vue';

import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';

import PetManagement from '@/views/PetManagement.vue';
import AdminPage from '@/views/AdminPage.vue';

import AuthModal from '@/components/AuthModal.vue';
import PetDetailModal from '@/components/PetDetailModal.vue';
import PetFormModal from '@/components/PetFormModal.vue';

const currentPage = ref('pets');

const dictStore = useDictionaryStore();
const petStore = usePetStore();
const authStore = useAuthStore();

const isAuthModalVisible = ref(false);

const showAdminPage = () => {
  if (authStore.isAuthenticated) {
    currentPage.value = 'admin';
  } else {
    authStore.error = null;
    isAuthModalVisible.value = true;
  }
};

watch(
  () => authStore.isAuthenticated,
  (isNowAuthenticated) => {
    if (isNowAuthenticated) {
      isAuthModalVisible.value = false;
      currentPage.value = 'admin';
    }
  }
);

onMounted(() => {
  dictStore.loadAllAppDictionaries();
  petStore.loadPetList();
  petStore.loadUpcomingEvents();
});

</script>

<template>
  <div class="container">

    <header>
      <nav>
        <ul><li><strong>🐾 宠物管家 (V2)</strong></li></ul>
        <ul>
          <li>
            <a href="#"
               :class="{ 'secondary': currentPage !== 'pets' }"
               @click.prevent="currentPage = 'pets'">
              宠物管理
            </a>
          </li>
          <li>
            <a href="#"
               :class="{ 'secondary': currentPage !== 'admin' }"
               @click.prevent="showAdminPage">
              后台管理
            </a>
          </li>
        </ul>
      </nav>
    </header>

    <hr>

    <main>
      <PetManagement v-if="currentPage === 'pets'" />
      <AdminPage v-if="currentPage === 'admin'" />
    </main>

    <AuthModal
      :open="isAuthModalVisible"
      @close="isAuthModalVisible = false"
    />

    <PetDetailModal />
    <PetFormModal />

  </div>
</template>

<style>
/* (O_1171 修复) 全局样式 */
.container {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
