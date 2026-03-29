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
  NSpace,
  NIcon,
  NDivider
} from 'naive-ui';
import { PersonOutline, LockClosedOutline, PawOutline } from '@vicons/ionicons5';

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
    style="width: 420px; border-radius: 24px;"
    :bordered="false"
    class="auth-modal"
    :mask-closable="false"
  >
    <!-- 头部图标 -->
    <div class="auth-header">
      <div class="auth-icon">
        <n-icon :component="PawOutline" size="48" color="#FF9BA8" />
      </div>
      <h2 class="auth-title">{{ isRegisterMode ? '注册新账号' : '欢迎回来' }}</h2>
      <p class="auth-subtitle">{{ isRegisterMode ? '创建账号，开始萌宠之旅' : '登录您的萌宠管理系统' }}</p>
    </div>

    <n-form @submit.prevent="handleSubmit" class="auth-form">
      <n-form-item label="用户名" label-style="font-weight: 600;">
        <n-input
          v-model:value="localUsername"
          placeholder="请输入用户名"
          size="large"
          autofocus
          @input="authStore.error = null"
        >
          <template #prefix>
            <n-icon :component="PersonOutline" color="#9CA3AF" />
          </template>
        </n-input>
      </n-form-item>

      <n-form-item label="密码" label-style="font-weight: 600;">
        <n-input
          type="password"
          show-password-on="mousedown"
          v-model:value="localPassword"
          placeholder="请输入密码"
          size="large"
          @input="authStore.error = null"
        >
          <template #prefix>
            <n-icon :component="LockClosedOutline" color="#9CA3AF" />
          </template>
        </n-input>
      </n-form-item>

      <n-alert
        v-if="authStore.error"
        :title="isRegisterMode ? '注册失败' : '登录失败'"
        type="error"
        closable
        @close="authStore.error = null"
        class="auth-error"
      >
        {{ authStore.error }}
      </n-alert>
    </n-form>

    <template #footer>
      <div class="auth-footer">
        <n-button
          type="primary"
          block
          size="large"
          @click="handleSubmit"
          :loading="authStore.loading"
          class="submit-btn"
        >
          {{ isRegisterMode ? '立即注册' : '立即登录' }}
        </n-button>

        <n-divider>或者</n-divider>

        <n-button text type="primary" @click="toggleMode" class="toggle-btn">
          {{ isRegisterMode ? '已有账号？去登录' : '没有账号？去注册' }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<style scoped>
.auth-modal :deep(.n-card-header) {
  padding-bottom: 0;
}

.auth-modal :deep(.n-card__content) {
  padding-top: 0;
}

/* 头部 */
.auth-header {
  text-align: center;
  padding: 20px 0;
}

.auth-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFE4E9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: #2D2D2D;
  margin-bottom: 8px;
}

.auth-subtitle {
  color: #9CA3AF;
  font-size: 14px;
}

/* 表单 */
.auth-form {
  margin-top: 20px;
}

.auth-form :deep(.n-form-item-label) {
  font-weight: 600;
  color: #4A4A4A;
}

.auth-form :deep(.n-input) {
  border-radius: 12px;
}

.auth-error {
  margin-top: 16px;
  border-radius: 12px;
}

/* 底部 */
.auth-footer {
  text-align: center;
}

.submit-btn {
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4C2 100%) !important;
  border: none;
  border-radius: 16px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(255, 155, 168, 0.3);
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.4);
}

.auth-footer :deep(.n-divider) {
  margin: 20px 0;
}

.toggle-btn {
  font-weight: 600;
}
</style>
