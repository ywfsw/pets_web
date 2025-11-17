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
  darkTheme,
  useMessage
} from 'naive-ui';

import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';

import PetManagement from '@/views/PetManagement.vue';
import AdminPage from '@/views/AdminPage.vue';

import AuthModal from '@/components/AuthModal.vue';
import PetDetailModal from '@/components/PetDetailModal.vue';
import PetFormModal from '@/components/PetFormModal.vue';
import DictItemFormModal from '@/components/DictItemFormModal.vue';

// --- Naive UI Setup ---
const theme = ref(darkTheme);

// --- App State ---
const activeKey = ref('pets');

const menuOptions = [
  { label: '宠物管理', key: 'pets' },
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

onMounted(() => {
  dictStore.loadAllAppDictionaries();
  petStore.loadPetList();
  petStore.loadUpcomingEvents();
});

// A component to be able to use message provider
const AppContent = {
  setup() {
    window.$message = useMessage()
  }
}

</script>

<template>
  <n-config-provider :theme="theme">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <app-content />
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
                    <n-menu v-model:value="activeKey" mode="horizontal" :options="menuOptions" @update:value="handleMenuUpdate" />
                  </template>
                </n-page-header>
              </n-layout-header>

              <n-layout-content content-style="padding: 24px; max-width: 1200px; margin: 0 auto;">
                <PetManagement v-if="activeKey === 'pets'" />
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
