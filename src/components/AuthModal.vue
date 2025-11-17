<script setup>
import { ref, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore.js';
import {
  NModal,
  NCard,
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

// --- 3. State (本地) ---
const localPassword = ref('');

// --- 4. Logic ---
const handleSubmit = async () => {
  if (!localPassword.value) return;
  const success = await authStore.login(localPassword.value);
  if (success) {
    localPassword.value = '';
  }
  // On failure, the error will be displayed.
};

const handleClose = () => {
  authStore.error = null;
  localPassword.value = '';
  emit('close');
};

// Watch for the modal opening to focus the input
watch(() => props.show, (isShown) => {
  if (isShown) {
    authStore.error = null;
    localPassword.value = '';
  }
});

</script>

<template>
  <n-modal
    :show="show"
    @update:show="handleClose"
    preset="card"
    style="width: 450px;"
    title="身份认证"
    :bordered="false"
  >
    <n-form @submit.prevent="handleSubmit">
      <n-form-item label="请输入字典管理密码">
        <n-input
          type="password"
          show-password-on="mousedown"
          v-model:value="localPassword"
          placeholder="Password"
          autofocus
          @input="authStore.error = null"
        />
      </n-form-item>

      <n-alert v-if="authStore.error" title="认证失败" type="error" closable @close="authStore.error = null">
        {{ authStore.error }}
      </n-alert>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="authStore.loading">
          提交
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
