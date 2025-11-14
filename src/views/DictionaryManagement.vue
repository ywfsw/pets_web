<script setup>
import { ref } from 'vue';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import DictTypeTree from '@/components/DictTypeTree.vue';

// (❗ 恢复) 导入我们刚创建的“模态框组件”
import DictItemFormModal from '@/components/DictItemFormModal.vue';

// (❗ 恢复) 导入 API 层
import { createDictItem } from '@/api.js';


// --- 1. State (状态) ---
const dictStore = useDictionaryStore();
const selectedDictType = ref(null);

// (❗) 模态框的状态
const isModalOpen = ref(false);

// --- 2. Handlers (处理器) ---

const onTypeSelect = (type) => {
  selectedDictType.value = type;
  dictStore.loadDictItems(type.dictCode);
};

/**
 * (❗ 恢复) 处理“添加”按钮点击
 */
const handleCreateItem = () => {
  isModalOpen.value = true; // (❗) 打开模态框
};

/**
 * (❗ 恢复) 处理来自“模态框”的 'save' 事件
 */
const handleSaveItem = async (payload, onComplete) => {
  try {
    // (❗) 1. 调用 API
    const response = await createDictItem(payload);
    alert(response.data); // (显示后端返回的 "创建成功")

    isModalOpen.value = false; // (❗) 2. 关闭模态框

    // (❗) 3. (关键) 刷新
    dictStore.loadDictItems(selectedDictType.value.dictCode);
    dictStore.loadAllAppDictionaries(); // (❗ 刷新全局字典)

  } catch (err) {
    console.error("创建字典项失败:", err);
    alert("创建失败: " + (err.response?.data || err.message));
  } finally {
    onComplete(); // (❗) 通知模态框停止 loading
  }
};

</script>

<template>
  <div class="grid">

    <DictTypeTree
      :treeData="dictStore.dictTypeTree"
      :selectedCode="selectedDictType ? selectedDictType.dictCode : null"
      :aria-busy="dictStore.loadingTypes"
      @select="onTypeSelect"
    />

    <article :aria-busy="dictStore.loadingItems">

      <header v-if="!selectedDictType">
        <strong>字典项</strong><br>
        <small>请从左侧选择一个字典类型</small>
      </header>

      <header v-else>
        <strong>字典项 (<code>{{ selectedDictType.dictCode }}</code>)</strong>
        <button
          class="outline"
          @click="handleCreateItem"
          style="padding: 0.25rem 0.5rem; margin-left: 1rem;">
          +
        </button>
      </header>

      <table v-if="selectedDictType">
        <thead>
        <tr>
          <th>ID</th>
          <th>标签 (Label)</th>
          <th>值 (Value)</th>
          <th>父ID</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="item in dictStore.dictItemList" :key="item.id">
          <td>{{ item.id }}</td>
          <td><strong>{{ item.itemLabel }}</strong></td>
          <td><code>{{ item.itemValue }}</code></td>
          <td>{{ item.parentId || 'N/A' }}</td>
          <td>
            <div class="grid" style="--pico-grid-spacing: 0.5rem;">
              <button class="secondary" style="padding: 0.25rem 0.5rem;">编辑</button>
              <button class="outline contrast" style="padding: 0.25rem 0.5rem;">删除</button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </article>
  </div>

  <DictItemFormModal
    :open="isModalOpen"
    :contextType="selectedDictType"
    :isEdit="false"
    @close="isModalOpen = false"
    @save="handleSaveItem"
  />

</template>

<style scoped>
/* (无样式) */
</style>
