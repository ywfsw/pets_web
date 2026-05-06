<script setup>
import { ref, onMounted, watch, computed, h } from 'vue';
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
  NDropdown,
  NDrawer,
  NDrawerContent
} from 'naive-ui';
import { Moon, Sunny, PawOutline, Images, Settings, LogOutOutline, HomeOutline, TimeOutline, RestaurantOutline, MedicalOutline, ScaleOutline, TrophyOutline, MenuOutline } from '@vicons/ionicons5';

// 图标组件映射（用于抽屉菜单渲染）
const iconComponentMap = {
  'dashboard': HomeOutline,
  'pets': PawOutline,
  'pet-album': Images,
  'timeline': TimeOutline,
  'feeding': RestaurantOutline,
  'health-events': MedicalOutline,
  'weight-logs': ScaleOutline,
  'leaderboard': TrophyOutline,
  'admin': Settings,
};

import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';

import DashboardView from '@/views/DashboardView.vue';
import PetManagement from '@/views/PetManagement.vue';
import PetAlbum from '@/views/PetAlbum.vue';
import AdminPage from '@/views/AdminPage.vue';
import GrowthTimelineView from '@/views/GrowthTimelineView.vue';
import FeedingRecordsView from '@/views/FeedingRecordsView.vue';
import HealthEventsView from '@/views/HealthEventsView.vue';
import WeightLogsView from '@/views/WeightLogsView.vue';
import LeaderboardView from '@/views/LeaderboardView.vue';

import AuthModal from '@/components/AuthModal.vue';
import PetDetailModal from '@/components/PetDetailModal.vue';
import PetFormModal from '@/components/PetFormModal.vue';
import DictItemFormModal from '@/components/DictItemFormModal.vue';
import GlobalNaiveUIServices from '@/components/GlobalNaiveUIServices.vue';

// 宠物主题色 - 白天模式
const lightThemeOverrides = {
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

// 宠物主题色 - 夜间模式
const darkThemeOverrides = {
  common: {
    primaryColor: '#FF9BA8',
    primaryColorHover: '#FFB4C2',
    primaryColorPressed: '#FF7A8A',
    primaryColorSuppl: '#FFBFC5',
    primaryColorDesc: '#FFB4C2',
    infoColor: '#7DD3FC',
    successColor: '#86EFAC',
    warningColor: '#FCD34D',
    errorColor: '#FCA5A5',
    bodyColor: '#1A1A2E',
    cardColor: '#252542',
    modalColor: '#252542',
    popoverColor: '#252542',
    tableColor: '#252542',
    inputColor: '#1F1F3A',
    actionColor: '#252542',
    borderColor: '#3D3D5C',
    dividerColor: '#3D3D5C',
    textColorBase: '#E8E8E8',
    textColor1: '#FFFFFF',
    textColor2: '#B8B8CC',
    textColor3: '#8888A0',
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
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
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
const themeOverrides = computed(() => isDarkTheme.value ? darkThemeOverrides : lightThemeOverrides);

// 监听主题变化，动态设置 data-theme 属性
watch(isDarkTheme, (dark) => {
  if (dark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-mode');
  }
}, { immediate: true });

// 菜单选项 - 根据角色动态生成
const menuOptions = computed(() => {
  const options = [
    {
      label: '首页',
      key: 'dashboard',
      icon: () => h(NIcon, null, { default: () => h(HomeOutline) })
    },
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
      label: '成长时间线',
      key: 'timeline',
      icon: () => h(NIcon, null, { default: () => h(TimeOutline) })
    },
    {
      label: '喂养记录',
      key: 'feeding',
      icon: () => h(NIcon, null, { default: () => h(RestaurantOutline) })
    },
    {
      label: '健康事件',
      key: 'health-events',
      icon: () => h(NIcon, null, { default: () => h(MedicalOutline) })
    },
    {
      label: '体重管理',
      key: 'weight-logs',
      icon: () => h(NIcon, null, { default: () => h(ScaleOutline) })
    },
    {
      label: '排行榜',
      key: 'leaderboard',
      icon: () => h(NIcon, null, { default: () => h(TrophyOutline) })
    }
  ];

  // 只有管理员才能看到后台管理
  if (authStore.isAuthenticated && authStore.isAdmin) {
    options.push({
      label: '后台管理',
      key: 'admin',
      icon: () => h(NIcon, null, { default: () => h(Settings) })
    });
  }

  return options;
});

// 用户下拉菜单
const userMenuOptions = [
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) })
  }
];

// 打开登录弹窗
const openAuthModal = () => {
  authStore.error = null;
  isAuthModalVisible.value = true;
};

// App State - 使用 petStore 的 activePage 实现跨组件页面切换
const activeKey = computed({
  get: () => petStore.activePage,
  set: (val) => { petStore.activePage = val; }
});

const dictStore = useDictionaryStore();
const petStore = usePetStore();
const authStore = useAuthStore();
const isAuthModalVisible = ref(false);
const showMobileMenu = ref(false);

const handleMobileMenuClick = (key) => {
  handleMenuUpdate(key);
  showMobileMenu.value = false;
};

const handleMenuUpdate = (key) => {
  if (key === 'admin') {
    if (authStore.isAuthenticated && authStore.isAdmin) {
      petStore.activePage = 'admin';
    } else if (authStore.isAuthenticated && !authStore.isAdmin) {
      // 普通用户尝试访问后台，跳转到首页
      window.$message.warning('只有管理员才能访问后台管理');
      petStore.activePage = 'dashboard';
    } else {
      authStore.error = null;
      isAuthModalVisible.value = true;
    }
  } else {
    petStore.activePage = key;
  }
};

const handleLogout = async () => {
  await authStore.logout();
  if (petStore.activePage === 'admin') {
    petStore.activePage = 'dashboard';
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
      // 登录后如果当前是admin但不是管理员，跳转到pets
      if (petStore.activePage === 'admin' && !authStore.isAdmin) {
        petStore.activePage = 'dashboard';
        window.$message.warning('只有管理员才能访问后台管理');
      }
    }
  }
);

// 监听角色变化，更新菜单
watch(
  () => authStore.isAdmin,
  (isAdmin) => {
    // 如果不再是管理员但当前在admin页面，跳转到首页
    if (!isAdmin && petStore.activePage === 'admin') {
      petStore.activePage = 'dashboard';
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
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <GlobalNaiveUIServices />
            <n-layout style="min-height: 100vh;" class="pet-layout" :class="{ 'dark-mode': isDarkTheme }">
              <n-layout-header bordered class="pet-header">
                <n-page-header>
                  <template #title>
                    <a href="/" class="pet-logo">
                      <span class="pet-logo-icon">🐾</span>
                      <span class="pet-logo-text">萌宠之家</span>
                    </a>
                  </template>
                  <template #extra>
                    <!-- 桌面端导航 -->
                    <n-space align="center" :size="16" class="desktop-nav">
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
                            <span v-if="authStore.isAdmin" class="pet-role-badge">管理员</span>
                          </n-space>
                        </n-dropdown>
                      </div>

                      <!-- 未登录时显示登录按钮 -->
                      <n-button
                        v-if="!authStore.isAuthenticated"
                        type="primary"
                        class="pet-login-btn"
                        @click="openAuthModal"
                      >
                        登录 / 注册
                      </n-button>

                      <n-switch v-model:value="isDarkTheme" size="large" class="pet-theme-switch">
                        <template #checked>
                          <n-icon :component="Moon" size="16" />
                        </template>
                        <template #unchecked>
                          <n-icon :component="Sunny" size="16" />
                        </template>
                      </n-switch>
                    </n-space>

                    <!-- 移动端导航 -->
                    <div class="mobile-nav">
                      <n-switch v-model:value="isDarkTheme" size="small" class="pet-theme-switch">
                        <template #checked>
                          <n-icon :component="Moon" size="14" />
                        </template>
                        <template #unchecked>
                          <n-icon :component="Sunny" size="14" />
                        </template>
                      </n-switch>
                      <n-button
                        quaternary
                        circle
                        size="large"
                        class="hamburger-btn"
                        @click="showMobileMenu = true"
                      >
                        <template #icon>
                          <n-icon :component="MenuOutline" size="24" />
                        </template>
                      </n-button>
                    </div>
                  </template>
                </n-page-header>
              </n-layout-header>
              <n-layout-content content-style="padding: 24px; max-width: 1400px; margin: 0 auto; width: 100%;">
                <div class="pet-content">
                  <DashboardView v-if="activeKey === 'dashboard'" />
                  <PetManagement v-if="activeKey === 'pets'" />
                  <PetAlbum v-if="activeKey === 'pet-album'" />
                  <GrowthTimelineView v-if="activeKey === 'timeline'" />
                  <FeedingRecordsView v-if="activeKey === 'feeding'" />
                  <HealthEventsView v-if="activeKey === 'health-events'" />
                  <WeightLogsView v-if="activeKey === 'weight-logs'" />
                  <LeaderboardView v-if="activeKey === 'leaderboard'" />
                  <AdminPage v-if="activeKey === 'admin'" />
                </div>
              </n-layout-content>
              <n-layout-footer bordered class="pet-footer">
                <span>Made with ❤️ 萌宠之家</span>
              </n-layout-footer>
            </n-layout>
            <!-- Mobile Drawer -->
            <n-drawer
              v-model:show="showMobileMenu"
              placement="right"
              :width="280"
              class="mobile-drawer"
            >
              <n-drawer-content :native-scrollbar="false">
                <template #header>
                  <div class="drawer-header">
                    <span class="drawer-title">🐾 萌宠之家</span>
                  </div>
                </template>
                <div class="drawer-body">
                  <!-- 用户信息 -->
                  <div v-if="authStore.isAuthenticated" class="drawer-user">
                    <n-avatar
                      round
                      size="large"
                      style="background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%);"
                    >
                      {{ authStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
                    </n-avatar>
                    <div class="drawer-user-info">
                      <span class="drawer-username">{{ authStore.userInfo?.username || '用户' }}</span>
                      <span v-if="authStore.isAdmin" class="pet-role-badge">管理员</span>
                    </div>
                  </div>

                  <n-button
                    v-if="!authStore.isAuthenticated"
                    type="primary"
                    block
                    class="pet-login-btn"
                    @click="showMobileMenu = false; openAuthModal()"
                    style="margin-bottom: 16px;"
                  >
                    登录 / 注册
                  </n-button>

                  <!-- 导航菜单 -->
                  <div class="drawer-menu">
                    <div
                      v-for="item in menuOptions"
                      :key="item.key"
                      class="drawer-menu-item"
                      :class="{ active: activeKey === item.key }"
                      @click="handleMobileMenuClick(item.key)"
                    >
                      <n-icon :component="iconComponentMap[item.key]" size="20" />
                      <span>{{ item.label }}</span>
                    </div>
                  </div>

                  <!-- 底部操作 -->
                  <div class="drawer-footer">
                    <div class="drawer-footer-row">
                      <span class="drawer-footer-label">深色模式</span>
                      <n-switch v-model:value="isDarkTheme" size="small">
                        <template #checked>
                          <n-icon :component="Moon" size="12" />
                        </template>
                        <template #unchecked>
                          <n-icon :component="Sunny" size="12" />
                        </template>
                      </n-switch>
                    </div>
                    <div
                      v-if="authStore.isAuthenticated"
                      class="drawer-menu-item logout-item"
                      @click="handleLogout(); showMobileMenu = false"
                    >
                      <n-icon :component="LogOutOutline" />
                      <span>退出登录</span>
                    </div>
                  </div>
                </div>
              </n-drawer-content>
            </n-drawer>

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

/* 头部样式 - 白天模式 */
.pet-header {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  transition: background-color 0.3s ease;
}

/* 头部样式 - 夜间模式 */
.dark-mode .pet-header {
  background: rgba(37, 37, 66, 0.95) !important;
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

.dark-mode .pet-user-area {
  background: #3D3D5C;
}

.pet-user-area:hover {
  background: #FFE4E9;
}

.dark-mode .pet-user-area:hover {
  background: #4D4D6C;
}

.pet-user-info {
  cursor: pointer;
}

.pet-username {
  font-weight: 600;
  color: #4A4A4A;
}

.dark-mode .pet-username {
  color: #E8E8E8;
}

/* 登录按钮 */
.pet-login-btn {
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%) !important;
  border: none !important;
  border-radius: 20px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 15px rgba(255, 155, 168, 0.3) !important;
  transition: all 0.3s ease !important;
}

.pet-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.4) !important;
}

.dark-mode .pet-login-btn {
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%) !important;
}

.dark-mode .pet-username {
  color: #E8E8E8;
}

/* 角色徽章 */
.pet-role-badge {
  font-size: 10px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%);
  color: white;
  border-radius: 10px;
  font-weight: 600;
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
  transition: all 0.3s ease;
}

.dark-mode .pet-footer {
  background: rgba(37, 37, 66, 0.9) !important;
  color: #8888A0;
}

/* 移动端导航 */
.mobile-nav {
  display: none;
  align-items: center;
  gap: 8px;
}

.hamburger-btn {
  color: #FF9BA8 !important;
}

/* 抽屉样式 */
.drawer-header {
  display: flex;
  align-items: center;
}

.drawer-title {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0 20px;
  border-bottom: 1px solid var(--border-color, #F0E6E0);
  margin-bottom: 16px;
}

.drawer-user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drawer-username {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-color-1, #2D2D2D);
}

.drawer-menu {
  flex: 1;
}

.drawer-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #6B6B6B;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.drawer-menu-item:hover {
  background: #FFF5F7;
  color: #FF7A8A;
}

.drawer-menu-item.active {
  background: linear-gradient(135deg, #FFF0F3 0%, #FFE4E9 100%);
  color: #FF7A8A;
  font-weight: 600;
}

.drawer-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #F0E6E0);
}

.drawer-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  margin-bottom: 8px;
}

.drawer-footer-label {
  font-size: 14px;
  color: #6B6B6B;
}

.logout-item {
  color: #FCA5A5 !important;
}

.logout-item:hover {
  background: #FFF0F0 !important;
  color: #EF4444 !important;
}

/* 深色主题抽屉样式 */
.dark-mode .drawer-user {
  border-color: #3D3D5C;
}

.dark-mode .drawer-username {
  color: #E8E8E8;
}

.dark-mode .drawer-menu-item {
  color: #B8B8CC;
}

.dark-mode .drawer-menu-item:hover {
  background: #2D2D4A;
  color: #FF9BA8;
}

.dark-mode .drawer-menu-item.active {
  background: linear-gradient(135deg, #3D2D3D 0%, #3D2D4A 100%);
  color: #FF9BA8;
}

.dark-mode .drawer-footer {
  border-color: #3D3D5C;
}

.dark-mode .drawer-footer-label {
  color: #B8B8CC;
}

.dark-mode .logout-item {
  color: #FCA5A5 !important;
}

.dark-mode .logout-item:hover {
  background: #3D2D2D !important;
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

  .pet-role-badge {
    display: none;
  }

  .desktop-nav {
    display: none !important;
  }

  .mobile-nav {
    display: flex !important;
  }
}
</style>
