<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick, h } from 'vue';
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
  NLayout,
  NLayoutContent,
  NLayoutFooter,
  NSwitch,
  NIcon,
  darkTheme,
  NAvatar,
  NDropdown
} from 'naive-ui';
import { Moon, Sunny, PawOutline, Images, Settings, LogOutOutline, HomeOutline, TimeOutline, RestaurantOutline, MedicalOutline, ScaleOutline, TrophyOutline, BrushOutline, MedkitOutline, HeartOutline } from '@vicons/ionicons5';

// 图标组件映射（用于抽屉菜单渲染）
const iconComponentMap = {
  'dashboard': HomeOutline,
  'health-overview': HeartOutline,
  'pets': PawOutline,
  'pet-album': Images,
  'timeline': TimeOutline,
  'feeding': RestaurantOutline,
  'bathing': BrushOutline,
  'medication': MedkitOutline,
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
import BathingRecordsView from '@/views/BathingRecordsView.vue';
import MedicationRecordsView from '@/views/MedicationRecordsView.vue';
import HealthEventsView from '@/views/HealthEventsView.vue';
import WeightLogsView from '@/views/WeightLogsView.vue';
import LeaderboardView from '@/views/LeaderboardView.vue';
import HealthOverviewView from '@/views/HealthOverviewView.vue';

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
    { label: '首页', key: 'dashboard' },
    { label: '健康概览', key: 'health-overview' },
    { label: '宠物管理', key: 'pets' },
    { label: '宠物相册', key: 'pet-album' },
    { label: '成长时间线', key: 'timeline' },
    { label: '喂养记录', key: 'feeding' },
    { label: '洗澡美容', key: 'bathing' },
    { label: '用药记录', key: 'medication' },
    { label: '健康事件', key: 'health-events' },
    { label: '体重管理', key: 'weight-logs' },
    { label: '排行榜', key: 'leaderboard' }
  ];

  if (authStore.isAuthenticated && authStore.isAdmin) {
    options.push({ label: '后台管理', key: 'admin' });
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
const showScrollTop = ref(false);

// 抽屉滑动手势关闭
const drawerRef = ref(null);
const drawerOverlayRef = ref(null);
let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;
let swipeOffset = 0;
const SWIPE_THRESHOLD = 80;

const onSwipeTouchStart = (e) => {
  if (e.touches.length !== 1) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  isSwiping = false;
  swipeOffset = 0;

  const drawer = drawerRef.value;
  if (!drawer) return;
  const inner = drawer.querySelector('.drawer-swipe-inner');
  if (inner) {
    inner.style.transition = 'none';
  }
};

const onSwipeTouchMove = (e) => {
  if (e.touches.length !== 1) return;
  const deltaX = e.touches[0].clientX - touchStartX;
  const deltaY = e.touches[0].clientY - touchStartY;

  if (!isSwiping) {
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping = true;
    } else if (Math.abs(deltaY) > 10) {
      return;
    } else {
      return;
    }
  }

  if (deltaX <= 0) return;

  swipeOffset = deltaX;
  const drawer = drawerRef.value;
  if (!drawer) return;

  const inner = drawer.querySelector('.drawer-swipe-inner');
  if (inner) {
    inner.style.transform = `translateX(${swipeOffset}px)`;
  }

  const overlay = drawerOverlayRef.value;
  if (overlay) {
    const progress = 1 - Math.min(swipeOffset / 300, 1);
    overlay.style.opacity = progress;
  }
};

const onSwipeTouchEnd = () => {
  const drawer = drawerRef.value;
  if (!drawer) return;

  const inner = drawer.querySelector('.drawer-swipe-inner');
  if (inner) {
    inner.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    inner.style.transform = 'translateX(0)';
  }

  const overlay = drawerOverlayRef.value;
  if (overlay) {
    overlay.style.transition = 'opacity 0.3s ease';
    overlay.style.opacity = '1';
  }

  if (isSwiping && swipeOffset > SWIPE_THRESHOLD) {
    showMobileMenu.value = false;
  }

  isSwiping = false;
  swipeOffset = 0;
};

const attachSwipeListeners = () => {
  nextTick(() => {
    const drawer = drawerRef.value;
    if (!drawer) return;
    drawer.addEventListener('touchstart', onSwipeTouchStart, { passive: true });
    drawer.addEventListener('touchmove', onSwipeTouchMove, { passive: true });
    drawer.addEventListener('touchend', onSwipeTouchEnd, { passive: true });
  });
};

const detachSwipeListeners = () => {
  const drawer = drawerRef.value;
  if (!drawer) return;
  drawer.removeEventListener('touchstart', onSwipeTouchStart);
  drawer.removeEventListener('touchmove', onSwipeTouchMove);
  drawer.removeEventListener('touchend', onSwipeTouchEnd);
};

watch(showMobileMenu, (open) => {
  if (open) {
    attachSwipeListeners();
  } else {
    detachSwipeListeners();
  }
});

onUnmounted(() => {
  detachSwipeListeners();
  window.removeEventListener('scroll', handleScroll);
});

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 400;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

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
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  window.addEventListener('scroll', handleScroll, { passive: true });
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
              <!-- 毛玻璃浮动导航栏 -->
              <header class="glass-nav">
                <div class="glass-nav-inner">
                  <!-- Logo -->
                  <a href="/" class="nav-logo" @click.prevent="petStore.activePage = 'dashboard'">
                    <span class="nav-logo-paw">🐾</span>
                    <span class="nav-logo-text">萌宠之家</span>
                  </a>

                  <!-- 桌面端导航菜单 -->
                  <nav class="nav-pills">
                    <button
                      v-for="item in menuOptions"
                      :key="item.key"
                      class="nav-pill"
                      :class="{ active: activeKey === item.key }"
                      @click="handleMenuUpdate(item.key)"
                    >
                      <n-icon :component="iconComponentMap[item.key]" size="16" />
                      <span class="nav-pill-label">{{ item.label }}</span>
                    </button>
                  </nav>

                  <!-- 右侧操作区 -->
                  <div class="nav-actions">
                    <!-- 用户区域 -->
                    <div v-if="authStore.isAuthenticated" class="nav-user" @click="null">
                      <n-dropdown
                        :options="userMenuOptions"
                        @select="handleUserMenuSelect"
                        trigger="click"
                      >
                        <div class="nav-user-trigger">
                          <div class="nav-avatar-ring">
                            <n-avatar
                              round
                              :size="32"
                              style="background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%); font-weight: 700;"
                            >
                              {{ authStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
                            </n-avatar>
                          </div>
                          <span class="nav-username">{{ authStore.userInfo?.username || '用户' }}</span>
                          <span v-if="authStore.isAdmin" class="nav-admin-badge">Admin</span>
                        </div>
                      </n-dropdown>
                    </div>

                    <n-button
                      v-if="!authStore.isAuthenticated"
                      type="primary"
                      class="nav-login-btn"
                      @click="openAuthModal"
                    >
                      登录 / 注册
                    </n-button>

                    <!-- 主题切换 -->
                    <button class="nav-theme-toggle" @click="isDarkTheme = !isDarkTheme">
                      <transition name="theme-icon" mode="out-in">
                        <n-icon v-if="isDarkTheme" :component="Moon" size="18" key="moon" />
                        <n-icon v-else :component="Sunny" size="18" key="sun" />
                      </transition>
                    </button>

                    <!-- 移动端汉堡按钮 -->
                    <button class="nav-hamburger" @click="showMobileMenu = true">
                      <span class="hamburger-line" :class="{ open: showMobileMenu }"></span>
                      <span class="hamburger-line" :class="{ open: showMobileMenu }"></span>
                      <span class="hamburger-line" :class="{ open: showMobileMenu }"></span>
                    </button>
                  </div>
                </div>
              </header>

              <n-layout-content content-style="padding: 96px 24px 24px; max-width: 1400px; margin: 0 auto; width: 100%;">
                <Transition name="page-fade" mode="out-in">
                  <div class="pet-content" :key="activeKey">
                    <DashboardView v-if="activeKey === 'dashboard'" />
                    <HealthOverviewView v-if="activeKey === 'health-overview'" />
                    <PetManagement v-if="activeKey === 'pets'" />
                    <PetAlbum v-if="activeKey === 'pet-album'" />
                    <GrowthTimelineView v-if="activeKey === 'timeline'" />
                    <FeedingRecordsView v-if="activeKey === 'feeding'" />
                    <BathingRecordsView v-if="activeKey === 'bathing'" />
                    <MedicationRecordsView v-if="activeKey === 'medication'" />
                    <HealthEventsView v-if="activeKey === 'health-events'" />
                    <WeightLogsView v-if="activeKey === 'weight-logs'" />
                    <LeaderboardView v-if="activeKey === 'leaderboard'" />
                    <AdminPage v-if="activeKey === 'admin'" />
                  </div>
                </Transition>
              </n-layout-content>
              <n-layout-footer bordered class="pet-footer">
                <span>Made with ❤️ 萌宠之家</span>
              </n-layout-footer>
            </n-layout>

            <!-- 悬浮返回顶部按钮 -->
            <Transition name="scroll-top-fade">
              <button
                v-if="showScrollTop"
                class="scroll-to-top-btn"
                @click="scrollToTop"
                aria-label="返回顶部"
              >
                <span class="scroll-to-top-icon">🐾</span>
                <span class="scroll-to-top-arrow">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 12V2M7 2L2 7M7 2L12 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </button>
            </Transition>

            <!-- Mobile Drawer - 毛玻璃升级版 -->
            <Transition name="drawer-backdrop">
              <div v-if="showMobileMenu" ref="drawerOverlayRef" class="drawer-overlay" @click="showMobileMenu = false"></div>
            </Transition>
            <Transition name="drawer-slide">
              <div v-if="showMobileMenu" ref="drawerRef" class="glass-drawer">
                <div class="drawer-swipe-inner">
                <div class="glass-drawer-header">
                  <span class="glass-drawer-logo">🐾</span>
                  <span class="glass-drawer-title">萌宠之家</span>
                  <button class="drawer-close-btn" @click="showMobileMenu = false">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>

                <!-- 用户信息 -->
                <div v-if="authStore.isAuthenticated" class="glass-drawer-user">
                  <div class="drawer-avatar-ring">
                    <n-avatar
                      round
                      :size="44"
                      style="background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%); font-weight: 700; font-size: 18px;"
                    >
                      {{ authStore.userInfo?.username?.charAt(0)?.toUpperCase() || 'U' }}
                    </n-avatar>
                  </div>
                  <div class="glass-drawer-user-info">
                    <span class="glass-drawer-username">{{ authStore.userInfo?.username || '用户' }}</span>
                    <span v-if="authStore.isAdmin" class="nav-admin-badge">Admin</span>
                  </div>
                </div>

                <button
                  v-if="!authStore.isAuthenticated"
                  class="glass-drawer-login"
                  @click="showMobileMenu = false; openAuthModal()"
                >
                  登录 / 注册
                </button>

                <!-- 导航菜单 -->
                <nav class="glass-drawer-menu">
                  <button
                    v-for="(item, idx) in menuOptions"
                    :key="item.key"
                    class="glass-drawer-item"
                    :class="{ active: activeKey === item.key }"
                    :style="{ animationDelay: `${idx * 0.04}s` }"
                    @click="handleMobileMenuClick(item.key)"
                  >
                    <span class="drawer-item-icon">
                      <n-icon :component="iconComponentMap[item.key]" size="20" />
                    </span>
                    <span class="drawer-item-label">{{ item.label }}</span>
                    <svg v-if="activeKey === item.key" class="drawer-item-check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </nav>

                <!-- 底部操作 -->
                <div class="glass-drawer-footer">
                  <div class="glass-drawer-footer-row">
                    <span class="glass-drawer-footer-label">
                      <n-icon :component="isDarkTheme ? Moon : Sunny" size="16" />
                      深色模式
                    </span>
                    <n-switch v-model:value="isDarkTheme" size="small">
                      <template #checked>
                        <n-icon :component="Moon" size="12" />
                      </template>
                      <template #unchecked>
                        <n-icon :component="Sunny" size="12" />
                      </template>
                    </n-switch>
                  </div>
                  <button
                    v-if="authStore.isAuthenticated"
                    class="glass-drawer-item logout-item"
                    @click="handleLogout(); showMobileMenu = false"
                  >
                    <span class="drawer-item-icon">
                      <n-icon :component="LogOutOutline" size="20" />
                    </span>
                    <span class="drawer-item-label">退出登录</span>
                  </button>
                </div>
                </div><!-- /.drawer-swipe-inner -->
              </div>
            </Transition>

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
/* ============================================
   毛玻璃浮动导航栏
   ============================================ */
.glass-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-bottom: 1px solid rgba(255, 155, 168, 0.15);
  box-shadow: 0 4px 30px rgba(255, 155, 168, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
  animation: nav-glass-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes nav-glass-in {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dark-mode .glass-nav {
  background: rgba(26, 26, 46, 0.78);
  border-bottom-color: rgba(255, 155, 168, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.15);
}

.glass-nav-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  gap: 16px;
}

/* Logo */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
  cursor: pointer;
}

.nav-logo-paw {
  font-size: 30px;
  animation: paw-bounce 3s ease-in-out infinite;
  display: inline-block;
}

@keyframes paw-bounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-3px) rotate(-5deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(-2px) rotate(3deg); }
}

.nav-logo-text {
  font-size: 21px;
  font-weight: 800;
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 40%, #E88BA0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

/* 桌面端 Pill 导航 */
.nav-pills {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(255, 245, 247, 0.6);
  padding: 4px;
  border-radius: 16px;
  border: 1px solid rgba(255, 155, 168, 0.1);
}

.dark-mode .nav-pills {
  background: rgba(61, 61, 92, 0.4);
  border-color: rgba(255, 155, 168, 0.08);
}

.nav-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #6B6B6B;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  position: relative;
}

.nav-pill:hover {
  color: #FF7A8A;
  background: rgba(255, 155, 168, 0.1);
}

.nav-pill.active {
  color: #fff;
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%);
  box-shadow: 0 2px 12px rgba(255, 122, 138, 0.35);
  font-weight: 600;
}

.dark-mode .nav-pill {
  color: #B8B8CC;
}

.dark-mode .nav-pill:hover {
  color: #FF9BA8;
  background: rgba(255, 155, 168, 0.08);
}

.dark-mode .nav-pill.active {
  color: #fff;
  box-shadow: 0 2px 12px rgba(255, 122, 138, 0.25);
}

/* 右侧操作区 */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 用户区域 */
.nav-user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 245, 247, 0.5);
  border: 1px solid rgba(255, 155, 168, 0.12);
}

.nav-user-trigger:hover {
  background: rgba(255, 155, 168, 0.12);
  border-color: rgba(255, 155, 168, 0.25);
  transform: translateY(-1px);
}

.dark-mode .nav-user-trigger {
  background: rgba(61, 61, 92, 0.5);
  border-color: rgba(255, 155, 168, 0.08);
}

.dark-mode .nav-user-trigger:hover {
  background: rgba(255, 155, 168, 0.1);
  border-color: rgba(255, 155, 168, 0.18);
}

.nav-avatar-ring {
  padding: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 50%, #FF7A8A 100%);
}

.nav-username {
  font-weight: 600;
  font-size: 13px;
  color: #4A4A4A;
}

.dark-mode .nav-username {
  color: #E8E8E8;
}

.nav-admin-badge {
  font-size: 10px;
  padding: 2px 7px;
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%);
  color: white;
  border-radius: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* 登录按钮 */
.nav-login-btn {
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%) !important;
  border: none !important;
  border-radius: 14px !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  height: 36px !important;
  padding: 0 18px !important;
  box-shadow: 0 2px 12px rgba(255, 122, 138, 0.3) !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
  color: #fff !important;
}

.nav-login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(255, 122, 138, 0.45) !important;
}

/* 主题切换按钮 */
.nav-theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 155, 168, 0.15);
  border-radius: 12px;
  background: rgba(255, 245, 247, 0.4);
  color: #FF9BA8;
  cursor: pointer;
  transition: all 0.25s ease;
}

.nav-theme-toggle:hover {
  background: rgba(255, 155, 168, 0.12);
  border-color: rgba(255, 155, 168, 0.3);
  transform: rotate(15deg);
}

.dark-mode .nav-theme-toggle {
  background: rgba(61, 61, 92, 0.4);
  border-color: rgba(255, 155, 168, 0.08);
  color: #FFB4C2;
}

.dark-mode .nav-theme-toggle:hover {
  background: rgba(255, 155, 168, 0.1);
  border-color: rgba(255, 155, 168, 0.2);
}

/* 主题图标切换动效 */
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.2s ease;
}
.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}
.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}

/* 汉堡按钮 */
.nav-hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 155, 168, 0.15);
  border-radius: 12px;
  background: rgba(255, 245, 247, 0.4);
  cursor: pointer;
  transition: all 0.25s ease;
  padding: 8px;
}

.nav-hamburger:hover {
  background: rgba(255, 155, 168, 0.12);
  border-color: rgba(255, 155, 168, 0.3);
}

.dark-mode .nav-hamburger {
  background: rgba(61, 61, 92, 0.4);
  border-color: rgba(255, 155, 168, 0.08);
}

.dark-mode .nav-hamburger:hover {
  background: rgba(255, 155, 168, 0.1);
}

.hamburger-line {
  display: block;
  width: 16px;
  height: 2px;
  background: #FF9BA8;
  border-radius: 2px;
  transition: all 0.25s ease;
}

/* 内容区域 - 顶部 padding 为导航栏留空间 */
.pet-content {
  min-height: 60vh;
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

/* ============================================
   毛玻璃移动端抽屉
   ============================================ */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1100;
}

/* Page transition animation */
.page-fade-enter-active {
  transition: opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
.page-fade-leave-active {
  transition: opacity 0.18s cubic-bezier(0.55, 0, 1, 0.45),
              transform 0.18s cubic-bezier(0.55, 0, 1, 0.45);
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

.glass-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 300px;
  max-width: 85vw;
  z-index: 1200;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  border-left: 1px solid rgba(255, 155, 168, 0.15);
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dark-mode .glass-drawer {
  background: rgba(26, 26, 46, 0.92);
  border-left-color: rgba(255, 155, 168, 0.08);
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.35);
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}

/* 抽屉滑动手势内部容器 */
.drawer-swipe-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px 20px;
  overflow-y: auto;
  will-change: transform;
  position: relative;
}

/* 左侧滑动提示条 */
.drawer-swipe-inner::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 40px;
  border-radius: 2px;
  background: rgba(255, 155, 168, 0.2);
  transition: all 0.3s ease;
}

.glass-drawer:hover .drawer-swipe-inner::before {
  background: rgba(255, 155, 168, 0.35);
  height: 48px;
}

.glass-drawer-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 155, 168, 0.12);
}

.dark-mode .glass-drawer-header {
  border-bottom-color: rgba(255, 155, 168, 0.08);
}

.glass-drawer-logo {
  font-size: 28px;
  animation: paw-bounce 3s ease-in-out infinite;
}

.glass-drawer-title {
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex: 1;
}

.drawer-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 155, 168, 0.15);
  border-radius: 10px;
  background: rgba(255, 245, 247, 0.4);
  color: #FF9BA8;
  cursor: pointer;
  transition: all 0.25s ease;
}

.drawer-close-btn:hover {
  background: rgba(255, 155, 168, 0.12);
  transform: rotate(90deg);
}

.dark-mode .drawer-close-btn {
  background: rgba(61, 61, 92, 0.4);
  border-color: rgba(255, 155, 168, 0.08);
}

/* 抽屉用户信息 */
.glass-drawer-user {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 155, 168, 0.12);
}

.dark-mode .glass-drawer-user {
  border-bottom-color: rgba(255, 155, 168, 0.08);
}

.drawer-avatar-ring {
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 50%, #FF7A8A 100%);
}

.glass-drawer-user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.glass-drawer-username {
  font-weight: 700;
  font-size: 16px;
  color: #2D2D2D;
}

.dark-mode .glass-drawer-username {
  color: #E8E8E8;
}

/* 抽屉登录按钮 */
.glass-drawer-login {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%);
  color: white;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 122, 138, 0.3);
  transition: all 0.25s ease;
  margin-bottom: 20px;
}

.glass-drawer-login:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 122, 138, 0.45);
}

/* 抽屉菜单 */
.glass-drawer-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.glass-drawer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: #6B6B6B;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
  animation: drawer-item-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes drawer-item-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.glass-drawer-item:hover {
  background: rgba(255, 155, 168, 0.08);
  color: #FF7A8A;
  padding-left: 20px;
}

.glass-drawer-item.active {
  background: linear-gradient(135deg, rgba(255, 155, 168, 0.12) 0%, rgba(255, 122, 138, 0.08) 100%);
  color: #FF7A8A;
  font-weight: 600;
  border-left: 3px solid #FF9BA8;
  padding-left: 13px;
}

.dark-mode .glass-drawer-item {
  color: #B8B8CC;
}

.dark-mode .glass-drawer-item:hover {
  background: rgba(255, 155, 168, 0.06);
  color: #FF9BA8;
}

.dark-mode .glass-drawer-item.active {
  background: linear-gradient(135deg, rgba(255, 155, 168, 0.08) 0%, rgba(255, 122, 138, 0.05) 100%);
  color: #FF9BA8;
  border-left-color: #FF9BA8;
}

.drawer-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 155, 168, 0.08);
  color: #FF9BA8;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.glass-drawer-item.active .drawer-item-icon {
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(255, 122, 138, 0.3);
}

.drawer-item-check {
  margin-left: auto;
  color: #FF9BA8;
}

/* 抽屉底部 */
.glass-drawer-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 155, 168, 0.12);
}

.dark-mode .glass-drawer-footer {
  border-top-color: rgba(255, 155, 168, 0.08);
}

.glass-drawer-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.glass-drawer-footer-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6B6B6B;
}

.dark-mode .glass-drawer-footer-label {
  color: #B8B8CC;
}

.logout-item {
  color: #FCA5A5 !important;
}

.logout-item:hover {
  background: rgba(252, 165, 165, 0.1) !important;
  color: #EF4444 !important;
}

.logout-item .drawer-item-icon {
  background: rgba(252, 165, 165, 0.1);
  color: #FCA5A5;
}

/* ============================================
   悬浮返回顶部按钮
   ============================================ */
.scroll-to-top-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1100;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid rgba(255, 155, 168, 0.25);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px) saturate(1.5);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  box-shadow: 0 4px 20px rgba(255, 155, 168, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0px;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  outline: none;
  -webkit-tap-highlight-color: transparent;
  animation: scroll-btn-entrance 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes scroll-btn-entrance {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.85);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.scroll-to-top-btn:hover {
  transform: translateY(-4px) scale(1.08);
  box-shadow: 0 8px 30px rgba(255, 155, 168, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  border-color: rgba(255, 155, 168, 0.45);
  background: rgba(255, 255, 255, 0.88);
}

.scroll-to-top-btn:active {
  transform: translateY(-1px) scale(0.97);
  transition-duration: 0.1s;
}

.scroll-to-top-icon {
  font-size: 14px;
  line-height: 1;
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.scroll-to-top-btn:hover .scroll-to-top-icon {
  transform: scale(1.2);
  animation: paw-bounce 0.6s ease infinite;
}

@keyframes paw-bounce {
  0%, 100% { transform: scale(1.2) translateY(0); }
  50% { transform: scale(1.2) translateY(-3px); }
}

.scroll-to-top-arrow {
  color: #FF9BA8;
  line-height: 1;
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  align-items: center;
}

.scroll-to-top-btn:hover .scroll-to-top-arrow {
  transform: translateY(-2px);
  color: #FF7A8A;
}

/* 暗色主题 */
.dark-mode .scroll-to-top-btn {
  background: rgba(37, 37, 66, 0.75);
  border-color: rgba(255, 155, 168, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 155, 168, 0.08) inset;
}

.dark-mode .scroll-to-top-btn:hover {
  background: rgba(37, 37, 66, 0.92);
  border-color: rgba(255, 155, 168, 0.3);
  box-shadow: 0 8px 30px rgba(255, 155, 168, 0.15), 0 0 0 1px rgba(255, 155, 168, 0.12) inset;
}

/* 过渡动画 */
.scroll-top-fade-enter-active {
  transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.scroll-top-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.scroll-top-fade-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.85);
}
.scroll-top-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .scroll-to-top-btn {
    bottom: 20px;
    right: 20px;
    width: 46px;
    height: 46px;
  }
  .scroll-to-top-icon {
    font-size: 12px;
  }
  .scroll-to-top-arrow svg {
    width: 12px;
    height: 12px;
  }
}

/* ============================================
   响应式
   ============================================ */
@media (max-width: 1100px) {
  .nav-pills {
    display: none;
  }
  .nav-hamburger {
    display: flex;
  }
  .nav-user-trigger .nav-username,
  .nav-user-trigger .nav-admin-badge {
    display: none;
  }
  .nav-user-trigger {
    padding: 4px;
    border-radius: 50%;
  }
}

@media (max-width: 480px) {
  .glass-nav-inner {
    padding: 0 16px;
    height: 56px;
  }
  .nav-logo-text {
    display: none;
  }
  .nav-login-btn {
    font-size: 12px !important;
    height: 32px !important;
    padding: 0 14px !important;
  }
  .glass-drawer {
    width: 260px;
  }
}
</style>
