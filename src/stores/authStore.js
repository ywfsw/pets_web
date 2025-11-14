// (这是 src/stores/authStore.js 的内容)

import { ref } from 'vue';
import { defineStore } from 'pinia';

// (❗) 定义一个叫 'auth' 的 store (仓库)
export const useAuthStore = defineStore('auth', () => {

  // --- 1. State (状态) ---
  // (对应你旧的 auth.isAuthenticated)
  const isAuthenticated = ref(false);
  const loading = ref(false); // (对应 auth.loading)
  const error = ref(null);    // (对应 auth.error)

  // --- 2. Actions (动作) ---

  /**
   * (❗) 登录逻辑 (和你旧的 login() 一样)
   * @param {string} password
   */
  async function login(password) {
    loading.value = true;
    error.value = null;

    // 模拟 API 延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    if (password === '123456') { // (硬编码密码)
      isAuthenticated.value = true;
      loading.value = false;
      return true; // (返回成功)
    } else {
      error.value = '密码错误';
      loading.value = false;
      return false; // (返回失败)
    }
  }

  /**
   * (❗) 登出 (可选, 暂时用不到)
   */
  function logout() {
    isAuthenticated.value = false;
  }

  // --- 3. Return (暴露) ---
  return {
    // State
    isAuthenticated,
    loading,
    error,

    // Actions
    login,
    logout
  };
});
