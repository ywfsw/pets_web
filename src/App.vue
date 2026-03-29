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
  NSwitch,
  NIcon,
  NButton,
  darkTheme,
  NAvatar,
  NDropdown
} from 'naive-ui';
import { Moon, Sunny, PawOutline, Images, Settings, LogOutOutline } from '@vicons/ionicons5';

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
import GlobalNaiveUIServices from '@/components/GlobalNaiveUIServices.vue';

// 宠物主题色
const petThemeOverrides = {
  common: {
    primaryColor: '#FF9BA8',
    primaryColorHover: '#FF7A8A',
    primaryColorPressed: '#FF5A6A',
    primaryColorSuppl: '#FFBFC5',
    primaryColorDesc: '#FFB4C2',
    infoColor: '#7DD3FC',
    successColor: '#86EFAC',
    warningColor: '#FCD34D',
    errorColor: '#FCA5A5',
    bodyColor: '#FFF9F5',
    cardColor: '#FFFFFF',
    modalColor: '#FFFFFF',
    popoverColor: '#FFFFFF',
    tableColor: '#FFFFFF',
    inputColor: '#FFFFFF',
    actionColor: '#FFF5F7',
    borderColor: '#F0E6E0',
    dividerColor: '#F5EDE8',
    textColorBase: '#4A4A4A',
    textColor1: '#2D2D2D',
    textColor2: '#6B6B6B',
    textColor3: '#9CA3AF',
    borderRadius: '12px',
    borderRadiusSmall: '8px',
    fontFamily: '"Nunito", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  Button: {
    borderRadiusMedium: '20px',
    borderRadiusSmall: '12px',
    borderRadiusLarge: '24px',
    heightMedium: '40px',
    fontWeight: '600',
  },
  Card: {
    borderRadius: '20px',
    paddingMedium: '20px',
    boxShadow: '0 4px 20px rgba(255, 155, 168, 0.12)',
  },
  Input: {
    borderRadius: '12px',
    heightMedium: '40px',
  },
  DataTable: {
    borderRadius: '16px',
  },
  Tag: {
    borderRadius: '10px',
  },
  Avatar: {
    borderRadius: '50%',
  },
  Menu: {
    borderRadius: '12px',
    itemBorderRadius: '10px',
  },
};

// 主题状态
const isDarkTheme = ref(false);
const theme = computed(() => (isDarkTheme.value ? darkTheme : null));

// 菜单选项
const menuOptions = [
  {
    label: '宠物管理',
    key: 'pets',
    icon: () => h(NIcon, null, { default: () => h(PawOutline) })
  },
  {
    label: '宠物相册',
    key: 'pet-album',
    icon: () => h(NIcon, null, { default: () => h(Images) })
  },
  {
    label: '后台管理',
    key: 'admin',
    icon: () => h(NIcon, null, { default: () => h(Settings) })
  },
];

// 用户下拉菜单
const userMenuOptions = [
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) })
  }
];

// App State
const activeKey = ref('pets');

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

const handleLogout = async () => {
  await authStore.logout();
  if (activeKey.value === 'admin') {
    activeKey.value = 'pets';
  }
};

const handleUserMenuSelect = (key) => {
  if (key === 'logout') {
    handleLogout();
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

// 引入 h 函数
import { h } from 'vue';
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="petThemeOverrides">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <GlobalNaiveUIServices />
            <n-layout style="min-height: 100vh;" class="pet-layout">
              <n-layout-header bordered class="pet-header">
                <n-page-header>
                  <template #title>
                    <a href="/" class="pet-logo">
                      <span class="pet-logo-icon">🐾</span>
                      <span class="pet-logo-text">萌宠之家</span>
                    </a>
                  </template>
                  <template #extra>
                    <n-space align="center" :size="16">
                      <n-menu
                        v-model:value="activeKey"
                        mode="horizontal"
                        :options="menuOptions"
                        @update:value="handleMenuUpdate"
                        class="pet-menu"
                      />

                      <div v-if="authStore.isAuthenticated" class="pet-user-area">
                        <n-dropdown
                          :options="userMenuOptions"
                          @select="handleUserMenuSelect"
                          trigger="click"
                        >
                          <n-space align="center" class="pet-user-info">
                            <n-avatar
                              round
                              size="small"
                              style="background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%);"
                            >
                              {{ authStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
                            </n-avatar>
                            <span class="pet-username">{{ authStore.userInfo?.username || '用户' }}</span>
                          </n-space>
                        </n-dropdown>
                      </div>

                      <n-switch v-model:value="isDarkTheme" size="large" class="pet-theme-switch">
                        <template #checked>
                          <n-icon :component="Moon" size="16" />
                        </template>
                        <template #unchecked>
                          <n-icon :component="Sunny" size="16" />
                        </template>
                      </n-switch>
                    </n-space>
                  </template>
                </n-page-header>
              </n-layout-header>
              <n-layout-content content-style="padding: 24px; max-width: 1400px; margin: 0 auto; width: 100%;">
                <div class="pet-content">
                  <PetManagement v-if="activeKey === 'pets'" />
                  <PetAlbum v-if="activeKey === 'pet-album'" />
                  <AdminPage v-if="activeKey === 'admin'" />
                </div>
              </n-layout-content>
              <n-layout-footer bordered class="pet-footer">
                <span>Made with ❤️ 萌宠之家</span>
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
/* 全局样式在 main.js 中导入 */

/* 头部样式 */
.pet-header {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
}

.pet-header[data-theme="dark"] {
  background: rgba(30, 30, 30, 0.95) !important;
}

.pet-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #FF9BA8;
}

.pet-logo-icon {
  font-size: 28px;
}

.pet-logo-text {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pet-menu {
  background: transparent !important;
}

/* 用户区域 */
.pet-user-area {
  padding: 4px 12px;
  background: #FFF5F7;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pet-user-area:hover {
  background: #FFE4E9;
}

.pet-user-info {
  cursor: pointer;
}

.pet-username {
  font-weight: 600;
  color: #4A4A4A;
}

/* 主题切换 */
.pet-theme-switch {
  margin-left: 8px;
}

/* 内容区域 */
.pet-content {
  animation: pet-fade-in 0.3s ease;
}

/* 页脚 */
.pet-footer {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9) !important;
  color: #9CA3AF;
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .pet-logo-text {
    display: none;
  }

  .pet-username {
    display: none;
  }

  .pet-user-area {
    padding: 4px 8px;
  }
}
</style>
