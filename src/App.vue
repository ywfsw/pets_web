<script setup>
// (❗) 新增: 导入 watch (侦听器)
import { ref, onMounted, watch } from 'vue';

// (❗) 导入所有 Store
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js'; // (❗ 新增)

// (❗) 导入所有“视图”和“组件”
import PetManagement from '@/views/PetManagement.vue';
import DictionaryManagement from '@/views/DictionaryManagement.vue';
import AuthModal from '@/components/AuthModal.vue'; // (❗ 新增)


// (逻辑区)
const currentPage = ref('pets');

// (❗) 实例化所有 Store
const dictStore = useDictionaryStore();
const petStore = usePetStore();
const authStore = useAuthStore(); // (❗ 新增)

// (❗ 新增) 认证模态框的本地状态
const isAuthModalVisible = ref(false);


/**
 * (❗ 升级) 点击“字典管理”
 */
const showDictionaryPage = () => {
  // (❗) 1. 检查 Store
  if (authStore.isAuthenticated) {
    currentPage.value = 'dictionaries';
  } else {
    // (❗) 2. 否则, 打开模态框
    authStore.error = null; // (清空旧错误)
    isAuthModalVisible.value = true;
  }
};

/**
 * (❗ 关键) 侦听 store 中的 isAuthenticated 状态
 */
watch(
  () => authStore.isAuthenticated, // (侦听这个值)
  (isNowAuthenticated) => {
    if (isNowAuthenticated) {
      // (❗) 如果刚变为 true (登录成功)
      isAuthModalVisible.value = false; // 1. 关闭模态框
      currentPage.value = 'dictionaries'; // 2. 切换页面
    }
  }
);

/**
 * (❗) App 启动时, 加载所有必要数据
 */
onMounted(() => {
  dictStore.loadAllAppDictionaries();
  petStore.loadPetList();
  petStore.loadUpcomingEvents();
});

</script>

<template>
  <div class="container">

    <header>
      <nav>
        <ul><li><strong>🐾 宠物管家 (V2)</strong></li></ul>
        <ul>
          <li>
            <a href="#"
               :class="{ 'secondary': currentPage !== 'pets' }"
               @click.prevent="currentPage = 'pets'">
              宠物管理
            </a>
          </li>
          <li>
            <a href="#"
               :class="{ 'secondary': currentPage !== 'dictionaries' }"
               @click.prevent="showDictionaryPage">
              字典管理
            </a>
          </li>
        </ul>
      </nav>
    </header>

    <hr>

    <main>
      <PetManagement v-if="currentPage === 'pets'" />
      <DictionaryManagement v-if="currentPage === 'dictionaries'" />
    </main>

    <AuthModal
      :open="isAuthModalVisible"
      @close="isAuthModalVisible = false"
    />

  </div>
</template>

<style scoped>
/* (CSS 区... 保持不变) */
.container {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
