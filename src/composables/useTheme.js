import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { darkTheme } from 'naive-ui';

const STORAGE_KEY = 'pet-theme';

// 响应式状态（模块级单例，所有组件共享）
const isDark = ref(false);

// Naive UI 主题覆盖 - 浅色
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

// Naive UI 主题覆盖 - 深色
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

// 读取持久化偏好
function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// 检测操作系统深色偏好
function getOSPreference() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

// 同步 DOM 属性
function syncDOM(dark) {
  if (dark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-mode');
  }
}

// 持久化到 localStorage
function persist(dark) {
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function useTheme() {
  // 计算属性
  const theme = computed(() => (isDark.value ? darkTheme : null));
  const themeOverrides = computed(() => (isDark.value ? darkThemeOverrides : lightThemeOverrides));

  // 切换主题
  const toggle = () => {
    isDark.value = !isDark.value;
  };

  // 设置主题
  const setDark = (dark) => {
    isDark.value = dark;
  };

  // 监听变化：同步 DOM + 持久化
  watch(isDark, (dark) => {
    syncDOM(dark);
    persist(dark);
  });

  // 初始化
  onMounted(() => {
    const stored = getStoredTheme();
    if (stored === 'dark') {
      isDark.value = true;
    } else if (stored === 'light') {
      isDark.value = false;
    } else {
      // 无存储值时跟随系统偏好
      isDark.value = getOSPreference();
    }
    syncDOM(isDark.value);

    // 监听系统主题变化（仅在用户未手动选择时生效）
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // 只有在没有手动选择时才跟随系统
      if (!getStoredTheme()) {
        isDark.value = e.matches;
      }
    };
    mql.addEventListener('change', handler);
    onUnmounted(() => mql.removeEventListener('change', handler));
  });

  return {
    isDark,
    theme,
    themeOverrides,
    toggle,
    setDark,
    lightThemeOverrides,
    darkThemeOverrides,
  };
}
