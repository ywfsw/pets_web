<script setup>
import { ref, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore.js';
import { useMessage } from 'naive-ui';
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NAlert,
  NSpace
} from 'naive-ui';

// --- 1. Props & Emits ---
const props = defineProps({
  show: Boolean
});
const emit = defineEmits(['close']);

// --- 2. Store ---
const authStore = useAuthStore();
const message = useMessage();

// --- 3. State (本地) ---
const localUsername = ref('');
const localPassword = ref('');
const isRegisterMode = ref(false);

// --- 4. Logic ---
const handleSubmit = async () => {
  if (!localUsername.value || !localPassword.value) return;
  
  let success = false;
  if (isRegisterMode.value) {
    success = await authStore.register(localUsername.value, localPassword.value);
    if (success) {
      message.success('注册成功，请登录');
      isRegisterMode.value = false;
      localPassword.value = '';
    }
  } else {
    success = await authStore.login(localUsername.value, localPassword.value);
    if (success) {
      message.success('登录成功');
      localUsername.value = '';
      localPassword.value = '';
      emit('close');
    }
  }
};

const handleClose = () => {
  authStore.error = null;
  localUsername.value = '';
  localPassword.value = '';
  isRegisterMode.value = false;
  emit('close');
};

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  authStore.error = null;
};

// Watch for the modal opening to focus the input
watch(() => props.show, (isShown) => {
  if (isShown) {
    authStore.error = null;
    localUsername.value = '';
    localPassword.value = '';
    isRegisterMode.value = false;
  }
});

</script>

<template>
  <n-modal
    :show="show"
    @update:show="handleClose"
    preset="card"
    style="width: 450px;"
    :title="isRegisterMode ? '注册新账号' : '登录系统'"
    :bordered="false"
  >
    <n-form @submit.prevent="handleSubmit">
      <n-form-item label="用户名">
        <n-input
          v-model:value="localUsername"
          placeholder="请输入用户名"
          autofocus
          @input="authStore.error = null"
        />
      </n-form-item>
      
      <n-form-item label="密码">
        <n-input
          type="password"
          show-password-on="mousedown"
          v-model:value="localPassword"
          placeholder="请输入密码"
          @input="authStore.error = null"
        />
      </n-form-item>

      <n-alert v-if="authStore.error" :title="isRegisterMode ? '注册失败' : '登录失败'" type="error" closable @close="authStore.error = null">
        {{ authStore.error }}
      </n-alert>
    </n-form>
    <template #footer>
      <n-space justify="space-between" align="center">
        <n-button text type="primary" @click="toggleMode">
          {{ isRegisterMode ? '已有账号？去登录' : '没有账号？去注册' }}
        </n-button>
        <n-space justify="end">
          <n-button @click="handleClose">取消</n-button>
          <n-button type="primary" @click="handleSubmit" :loading="authStore.loading">
            {{ isRegisterMode ? '注册' : '登录' }}
          </n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
</template>
