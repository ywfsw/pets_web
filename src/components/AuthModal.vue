<script setup>
import { ref } from 'vue';

// (❗) 导入并使用 Auth Store
import { useAuthStore } from '@/stores/authStore.js';

// --- 1. Props & Emits ---
defineProps({
  open: Boolean // (由父组件 App.vue 控制)
});
const emit = defineEmits(['close']); // (通知父组件关闭)

// --- 2. Store ---
const authStore = useAuthStore();

// --- 3. State (本地) ---
const localPassword = ref(''); // (只在模态框内部使用)

/**
 * (❗) 提交表单
 */
const handleSubmit = async () => {
  const success = await authStore.login(localPassword.value);
  if (success) {
    // (如果成功, App.vue 会监听到 store 变化, 自动关闭)
    localPassword.value = '';
  } else {
    // (如果失败, 保持打开, 等待 store 里的 error 显示)
    localPassword.value = '';
  }
};

/**
 * (❗) 关闭模态框
 */
const handleClose = () => {
  authStore.error = null; // (清空错误)
  localPassword.value = ''; // (清空密码)
  emit('close');
};

</script>

<template>
  <dialog :open="open" @click.self="handleClose">
    <article style="max-width: 400px;" :aria-busy="authStore.loading">
      <header>
        <a href="#" aria-label="Close" class="close" @click.prevent="handleClose"></a>
        <strong>身份认证</strong>
      </header>

      <form @submit.prevent="handleSubmit">
        <label for="authPassword">请输入字典管理密码</label>

        <input
          type="password"
          id="authPassword"
          v-model="localPassword"
          autofocus
          @input="authStore.error = null"
        >

        <button type="submit" :aria-busy="authStore.loading">提交</button>

        <small v-if="authStore.error" style="color: var(--pico-form-invalid-color);">
          {{ authStore.error }}
        </small>
      </form>
    </article>
  </dialog>
</template>

<style scoped>
/* (无样式) */
</style>
