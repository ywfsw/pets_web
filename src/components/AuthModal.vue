<script setup>
import { ref, watch, computed, reactive } from 'vue';
import { useAuthStore } from '@/stores/authStore.js';
import { useMessage } from 'naive-ui';
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NAlert,
  NIcon
} from 'naive-ui';
import { PersonOutline, LockClosedOutline, PawOutline } from '@vicons/ionicons5';

const props = defineProps({
  show: Boolean
});
const emit = defineEmits(['close']);

const authStore = useAuthStore();
const message = useMessage();

const localUsername = ref('');
const localPassword = ref('');
const isRegisterMode = ref(false);
const formRef = ref(null);

const formData = reactive({
  username: '',
  password: ''
});

watch(localUsername, (v) => { formData.username = v; });
watch(localPassword, (v) => { formData.password = v; });

const rules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应为 3-20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度应不少于 6 个字符', trigger: 'blur' }
  ]
}));

const handleSubmit = () => {
  formRef.value?.validate((errors) => {
    if (errors) return;
    doSubmit();
  });
};

const doSubmit = async () => {
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

watch(() => props.show, (isShown) => {
  if (isShown) {
    authStore.error = null;
    localUsername.value = '';
    localPassword.value = '';
    formData.username = '';
    formData.password = '';
    isRegisterMode.value = false;
  }
});
</script>

<template>
  <n-modal
    :show="show"
    @update:show="handleClose"
    :bordered="false"
    :mask-closable="false"
    :close-on-esc="true"
    class="auth-modal-wrap"
    transform-origin="center"
  >
    <div class="auth-glass-card">
      <!-- 浮动装饰元素 -->
      <div class="auth-decor auth-decor-1">🐾</div>
      <div class="auth-decor auth-decor-2">✨</div>
      <div class="auth-decor auth-decor-3">💕</div>
      <div class="auth-decor auth-decor-4">🌸</div>
      <div class="auth-decor auth-decor-5">⭐</div>
      <div class="auth-decor auth-decor-6">🦋</div>

      <!-- 关闭按钮 -->
      <button class="auth-close-btn" @click="handleClose" aria-label="关闭">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <!-- 头部 -->
      <div class="auth-header">
        <div class="auth-icon-glow"></div>
        <div class="auth-icon">
          <n-icon :component="PawOutline" size="44" color="#fff" />
        </div>
        <h2 class="auth-title">{{ isRegisterMode ? '注册新账号' : '欢迎回来' }}</h2>
        <p class="auth-subtitle">{{ isRegisterMode ? '创建账号，开始萌宠之旅 🐱' : '登录您的萌宠管理系统 🐶' }}</p>
      </div>

      <!-- 表单 -->
      <n-form ref="formRef" :model="formData" @submit.prevent="handleSubmit" :rules="rules" class="auth-form">
        <n-form-item label="用户名" path="username" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
          <n-input
            v-model:value="localUsername"
            placeholder="请输入用户名"
            size="large"
            autofocus
            @input="authStore.error = null"
            :disabled="authStore.loading"
          >
            <template #prefix>
              <n-icon :component="PersonOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item label="密码" path="password" :label-style="{ fontWeight: '600', color: 'var(--pet-text)' }">
          <n-input
            type="password"
            show-password-on="mousedown"
            v-model:value="localPassword"
            placeholder="请输入密码"
            size="large"
            @input="authStore.error = null"
            :disabled="authStore.loading"
          >
            <template #prefix>
              <n-icon :component="LockClosedOutline" />
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

      <!-- 底部 -->
      <div class="auth-footer">
        <n-button
          type="primary"
          block
          size="large"
          @click="handleSubmit"
          :loading="authStore.loading"
          class="submit-btn"
        >
          <span class="submit-btn-text">{{ isRegisterMode ? '立即注册' : '立即登录' }}</span>
        </n-button>

        <div class="auth-divider-row">
          <span class="auth-divider-line"></span>
          <span class="auth-divider-text">或者</span>
          <span class="auth-divider-line"></span>
        </div>

        <n-button text type="primary" @click="toggleMode" class="toggle-btn">
          {{ isRegisterMode ? '已有账号？去登录' : '没有账号？去注册' }}
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
/* 模态框外层：深色遮罩 + 渐变背景 */
.auth-modal-wrap :deep(.n-modal-mask) {
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(6px);
}

.auth-modal-wrap :deep(.n-modal-body-wrapper) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-modal-wrap :deep(.n-modal) {
  width: 440px !important;
  max-width: calc(100vw - 32px);
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  margin: 0 !important;
}

/* 毛玻璃卡片 */
.auth-glass-card {
  position: relative;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 28px;
  padding: 40px 36px 36px;
  overflow: hidden;
  box-shadow:
    0 8px 32px rgba(255, 155, 168, 0.15),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  animation: auth-card-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

:root[data-theme="dark"] .auth-glass-card,
[data-theme="dark"] .auth-glass-card {
  background: rgba(37, 37, 66, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.5),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

@keyframes auth-card-in {
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 关闭按钮 */
.auth-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  transition: all 0.2s ease;
  z-index: 2;
}

.auth-close-btn:hover {
  background: rgba(255, 155, 168, 0.12);
  color: #FF7A8A;
  transform: rotate(90deg);
}

:root[data-theme="dark"] .auth-close-btn,
[data-theme="dark"] .auth-close-btn {
  background: rgba(255, 255, 255, 0.06);
  color: #8888A0;
}

:root[data-theme="dark"] .auth-close-btn:hover,
[data-theme="dark"] .auth-close-btn:hover {
  background: rgba(255, 155, 168, 0.15);
  color: #FFB4C2;
}

/* 浮动装饰元素 */
.auth-decor {
  position: absolute;
  pointer-events: none;
  font-size: 20px;
  opacity: 0.25;
  z-index: 0;
}

.auth-decor-1 {
  top: 12px;
  left: 20px;
  font-size: 18px;
  animation: auth-float 6s ease-in-out infinite;
}

.auth-decor-2 {
  top: 40px;
  right: 50px;
  font-size: 14px;
  animation: auth-float 5s ease-in-out infinite 1s;
}

.auth-decor-3 {
  bottom: 80px;
  left: 16px;
  font-size: 16px;
  animation: auth-float 7s ease-in-out infinite 0.5s;
}

.auth-decor-4 {
  bottom: 40px;
  right: 20px;
  font-size: 22px;
  animation: auth-float 8s ease-in-out infinite 2s;
}

.auth-decor-5 {
  top: 50%;
  left: 8px;
  font-size: 12px;
  animation: auth-float 6s ease-in-out infinite 1.5s;
}

.auth-decor-6 {
  top: 30%;
  right: 12px;
  font-size: 16px;
  animation: auth-float 5.5s ease-in-out infinite 0.8s;
}

@keyframes auth-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(5deg); }
  50% { transform: translateY(-4px) rotate(-3deg); }
  75% { transform: translateY(-10px) rotate(2deg); }
}

/* 头部 */
.auth-header {
  text-align: center;
  padding: 8px 0 24px;
  position: relative;
  z-index: 1;
}

.auth-icon {
  width: 88px;
  height: 88px;
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 50%, #FFB4C2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  position: relative;
  box-shadow:
    0 4px 20px rgba(255, 155, 168, 0.35),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
  animation: auth-icon-bounce 3s ease-in-out infinite;
}

.auth-icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255, 155, 168, 0.25) 0%, transparent 70%);
  border-radius: 50%;
  animation: auth-glow-pulse 3s ease-in-out infinite;
  pointer-events: none;
  z-index: -1;
  margin-top: -24px;
}

@keyframes auth-icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes auth-glow-pulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
}

.auth-title {
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(135deg, #FF7A8A 0%, #FF9BA8 50%, #FFB4C2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

:root[data-theme="dark"] .auth-title,
[data-theme="dark"] .auth-title {
  background: linear-gradient(135deg, #FFB4C2 0%, #FF9BA8 50%, #FF7A8A 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.auth-subtitle {
  color: #9CA3AF;
  font-size: 14px;
  font-weight: 500;
}

:root[data-theme="dark"] .auth-subtitle,
[data-theme="dark"] .auth-subtitle {
  color: #8888A0;
}

/* 表单 */
.auth-form {
  position: relative;
  z-index: 1;
}

.auth-form :deep(.n-form-item-label) {
  font-weight: 600 !important;
}

.auth-form :deep(.n-input) {
  border-radius: 14px !important;
  transition: all 0.3s ease;
}

.auth-form :deep(.n-input:hover) {
  box-shadow: 0 2px 12px rgba(255, 155, 168, 0.12);
}

.auth-form :deep(.n-input--focus) {
  box-shadow: 0 0 0 3px rgba(255, 155, 168, 0.15), 0 2px 12px rgba(255, 155, 168, 0.12);
}

.auth-form :deep(.n-input__prefix) {
  color: #C4B5B8;
  margin-right: 4px;
}

:root[data-theme="dark"] .auth-form :deep(.n-input),
[data-theme="dark"] .auth-form :deep(.n-input) {
  border-color: #3D3D5C;
}

:root[data-theme="dark"] .auth-form :deep(.n-input:hover),
[data-theme="dark"] .auth-form :deep(.n-input:hover) {
  box-shadow: 0 2px 12px rgba(255, 155, 168, 0.08);
}

:root[data-theme="dark"] .auth-form :deep(.n-input__prefix),
[data-theme="dark"] .auth-form :deep(.n-input__prefix) {
  color: #8888A0;
}

.auth-error {
  margin-top: 12px;
  border-radius: 14px;
}

/* 底部 */
.auth-footer {
  text-align: center;
  margin-top: 24px;
  position: relative;
  z-index: 1;
}

.submit-btn {
  background: linear-gradient(135deg, #FF9BA8 0%, #FF7A8A 50%, #FFB4C2 100%) !important;
  border: none !important;
  border-radius: 16px !important;
  height: 50px;
  font-size: 16px;
  font-weight: 700 !important;
  box-shadow:
    0 4px 15px rgba(255, 155, 168, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.02em;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.submit-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow:
    0 8px 25px rgba(255, 155, 168, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:active {
  transform: translateY(0) !important;
}

.submit-btn-text {
  position: relative;
  z-index: 1;
}

.auth-divider-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0 16px;
}

.auth-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 155, 168, 0.2), transparent);
}

:root[data-theme="dark"] .auth-divider-line,
[data-theme="dark"] .auth-divider-line {
  background: linear-gradient(90deg, transparent, rgba(255, 155, 168, 0.15), transparent);
}

.auth-divider-text {
  font-size: 13px;
  color: #C4B5B8;
  font-weight: 500;
}

:root[data-theme="dark"] .auth-divider-text,
[data-theme="dark"] .auth-divider-text {
  color: #8888A0;
}

.toggle-btn {
  font-weight: 600 !important;
  font-size: 14px !important;
  transition: all 0.2s ease !important;
}

.toggle-btn:hover {
  opacity: 0.85;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .auth-glass-card {
    padding: 32px 24px 28px;
    border-radius: 24px;
  }

  .auth-icon {
    width: 72px;
    height: 72px;
  }

  .auth-title {
    font-size: 22px;
  }

  .submit-btn {
    height: 46px;
    font-size: 15px;
  }
}
</style>
