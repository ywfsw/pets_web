<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutFooter,
  NPageHeader,
  NMenu,
  NSpace,
  NSwitch, // Added NSwitch
  NIcon,   // Added NIcon
  darkTheme
} from 'naive-ui';
import { Moon, Sunny } from '@vicons/ionicons5'; // Added Moon and Sunny icons

import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';

import PetManagement from '@/views/PetManagement.vue';
import PetAlbum from '@/views/PetAlbum.vue';
import AdminPage from '@/views/AdminPage.vue';

import AuthModal from '@/components/AuthModal.vue';
import PetDetailModal from '@/components/PetDetailModal.vue';
import PetFormModal from '@/components/PetFormModal.vue';
import DictItemFormModal from '@/components/DictItemFormModal.vue';
import GlobalNaiveUIServices from '@/components/GlobalNaiveUIServices.vue'; // New import

// --- Naive UI Setup ---
const isDarkTheme = ref(true); // Initial theme state
const theme = computed(() => (isDarkTheme.value ? darkTheme : null)); // Computed theme

// --- App State ---
const activeKey = ref('pets');

const menuOptions = [
  { label: '宠物管理', key: 'pets' },
  { label: '宠物相册', key: 'pet-album' },
  { label: '后台管理', key: 'admin' },
];

const dictStore = useDictionaryStore();
const petStore = usePetStore();
const authStore = useAuthStore();
const isAuthModalVisible = ref(false);
const handleMenuUpdate = (key) => {
  if (key === 'admin') {
    if (authStore.isAuthenticated) {
      activeKey.value = 'admin';
    } else {
      authStore.error = null;
      isAuthModalVisible.value = true;
    }
  } else {
    activeKey.value = key;
  }
};
watch(
  () => authStore.isAuthenticated,
  (isNowAuthenticated) => {
    if (isNowAuthenticated) {
      isAuthModalVisible.value = false;
      activeKey.value = 'admin';
    }
  }
);
onMounted(async () => {
  await dictStore.loadAllAppDictionaries();
  petStore.loadPetList();
  petStore.loadUpcomingEvents();
});
</script>
<template>
  <n-config-provider :theme="theme">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <GlobalNaiveUIServices />
            <n-layout style="height: 100vh;">
              <n-layout-header bordered>
                <n-page-header>
                  <template #title>
                    <n-space align="center">
                      <a href="/">🐾</a>
                      <span>PETS</span>
                    </n-space>
                  </template>
                  <template #extra>
                    <n-space align="center">
                      <n-menu v-model:value="activeKey" mode="horizontal" :options="menuOptions" @update:value="handleMenuUpdate" />
                      <n-switch v-model:value="isDarkTheme" size="large">
                        <template #checked>
                          <n-icon :component="Moon" />
                        </template>
                        <template #unchecked>
                          <n-icon :component="Sunny" />
                        </template>
                      </n-switch>
                    </n-space>
                  </template>
                </n-page-header>
              </n-layout-header>
              <n-layout-content content-style="padding: 24px; max-width: 1200px; margin: 0 auto;">
                <PetManagement v-if="activeKey === 'pets'" />
                <PetAlbum v-if="activeKey === 'pet-album'" />
                <AdminPage v-if="activeKey === 'admin'" />
              </n-layout-content>
              <n-layout-footer bordered position="absolute" style="text-align: center; padding: 12px;">
                Made with ❤️ and Naive UI
              </n-layout-footer>
            </n-layout>
            <!-- Modals -->
            <AuthModal
              :show="isAuthModalVisible"
              @close="isAuthModalVisible = false"
            />
            <PetDetailModal />
            <PetFormModal />
            <DictItemFormModal />
          </n-dialog-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
<style>
body {
  margin: 0;
  padding: 0;
}
</style>
