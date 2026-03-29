// (这是 src/stores/authStore.js 的内容)

import { ref } from 'vue';
import { defineStore } from 'pinia';
import { login as apiLogin, register as apiRegister, getUserInfo as apiGetUserInfo, logout as apiLogout } from '@/api.js';

// (❗) 定义一个叫 'auth' 的 store (仓库)
export const useAuthStore = defineStore('auth', () => {

  // --- 1. State (状态) ---
  const isAuthenticated = ref(!!localStorage.getItem('token'));
  const loading = ref(false); 
  const error = ref(null);    
  const userInfo = ref(null);

  // 初始化时尝试获取用户信息
  const initAuth = async () => {
    if (isAuthenticated.value) {
      try {
        const res = await apiGetUserInfo();
        userInfo.value = res.data;
      } catch (err) {
        // Token 失效或错误
        logout();
      }
    }
  };
  initAuth();

  // --- 2. Actions (动作) ---

  async function login(username, password) {
    loading.value = true;
    error.value = null;

    try {
      const res = await apiLogin({ username, password });
      const { token, tokenName } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('tokenName', tokenName || 'satoken');
      
      isAuthenticated.value = true;
      
      // 登录成功后获取用户信息
      const userRes = await apiGetUserInfo();
      userInfo.value = userRes.data;
      
      loading.value = false;
      return true;
    } catch (err) {
      error.value = err.response?.data?.error || '登录失败';
      loading.value = false;
      return false;
    }
  }

  async function register(username, password) {
    loading.value = true;
    error.value = null;

    try {
      await apiRegister({ username, password });
      loading.value = false;
      return true;
    } catch (err) {
      error.value = err.response?.data?.error || '注册失败';
      loading.value = false;
      return false;
    }
  }

  async function logout() {
    try {
      if (isAuthenticated.value) {
        await apiLogout();
      }
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      isAuthenticated.value = false;
      userInfo.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('tokenName');
    }
  }

  // --- 3. Return (暴露) ---
  return {
    // State
    isAuthenticated,
    loading,
    error,
    userInfo,

    // Actions
    login,
    register,
    logout
  };
});
