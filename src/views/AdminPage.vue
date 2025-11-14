<script setup>
import { ref } from 'vue';

import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { usePetStore } from '@/stores/petStore.js';

import DictTypeTree from '@/components/DictTypeTree.vue';
import DictItemFormModal from '@/components/DictItemFormModal.vue';

const dictStore = useDictionaryStore();
const petStore = usePetStore();

const currentTab = ref('pets');

// (宠物 Handlers)
const handleCreatePet = () => { petStore.showPetFormModal(null); };
const handleShowDetail = (petId) => { petStore.showDetailModal(petId); };
const handleEditPet = (pet) => { petStore.showPetFormModal(pet); };
const handleDeletePet = (petId, petName) => {
  if (confirm(`TODO: 确定删除 [${petName}] 吗?`)) {
    // (TODO)
  }
};

// (字典 Handlers)
const selectedDictType = ref(null);
const onTypeSelect = (type) => {
  selectedDictType.value = type;
  dictStore.loadDictItems(type.dictCode);
};
const handleCreateItem = () => {
  dictStore.showDictItemModal(selectedDictType.value, null);
};

</script>

<template>
  <nav>
    <ul>
      <li><a href="#" :class="{ 'secondary': currentTab !== 'pets' }" @click.prevent="currentTab = 'pets'">宠物管理</a></li>
      <li><a href="#" :class="{ 'secondary': currentTab !== 'dictionaries' }" @click.prevent="currentTab = 'dictionaries'">字典管理</a></li>
    </ul>
  </nav>

  <hr style="margin-top: 0;">

  <div v-if="currentTab === 'pets'">
    <article :aria-busy="petStore.loadingList">
      <header>
        <h3>宠物列表 (后台)</h3>
        <button @click="handleCreatePet">添加新宠物</button>
      </header>
      <table>
        <thead>
        <tr>
          <th>ID</th>
          <th>名字</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="pet in petStore.petList" :key="pet.id">
          <td>{{ pet.id }}</td>
          <td><strong>{{ pet.name }}</strong></td>
          <td>
            <div class="grid" style="--pico-grid-spacing: 0.5rem;">
              <button @click="handleShowDetail(pet.id)">查看</button>
              <button class="secondary" @click="handleEditPet(pet)">编辑</button>
              <button class="outline secondary" @click="handleDeletePet(pet.id, pet.name)">删除</button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>

      <footer class="pagination-footer" v-if="petStore.totalPages > 0">
        <small>总计 {{ petStore.pagination.total }} 条 (第 {{ petStore.currentPage }} / {{ petStore.totalPages }} 页)</small>
        <nav>
          <ul>
            <li><button class="outline" :disabled="petStore.currentPage <= 1" @click="petStore.goToPrevPage()">&lt; 上一页</button></li>
            <li><button class="outline" :disabled="petStore.currentPage >= petStore.totalPages" @click="petStore.goToNextPage()">下一页 &gt;</button></li>
          </ul>
        </nav>
      </footer>
    </article>
  </div>

  <div v-if="currentTab === 'dictionaries'">
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
          <button class="outline" @click="handleCreateItem" style="padding: 0.25rem 0.5rem; margin-left: 1rem;">+</button>
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
  </div>

  <DictItemFormModal />
</template>

<style scoped>
.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--pico-spacing);
  margin-top: var(--pico-spacing);
  border-top: 1px solid var(--pico-muted-border-color);
}
.pagination-footer nav ul {
  margin-bottom: 0;
  display: flex;
  gap: 0.5rem;
}
.pagination-footer nav ul li {
  padding-left: 0;
}
.pagination-footer button {
  margin-bottom: 0;
}
</style>
