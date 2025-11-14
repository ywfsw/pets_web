<script setup>
// (❗) 导入我们刚创建的“Pet Store”
import { usePetStore } from '@/stores/petStore.js';

// (❗) 实例化 Store
// (注意: 数据加载的触发在 App.vue 的 onMounted 里)
const petStore = usePetStore();

// (❗) 处理器 (Handlers)
const handleCreatePet = () => {
  alert("TODO: 打开“添加宠物”模态框");
};

const handleShowDetail = (petId) => {
  alert(`TODO: 打开宠物详情 (ID: ${petId})`);
};

const handleEditPet = (pet) => {
  alert(`TODO: 编辑宠物 (Name: ${pet.name})`);
};

const handleDeletePet = (petId, petName) => {
  if (confirm(`TODO: 确定删除 [${petName}] 吗?`)) {
    // (API 调用...)
  }
};

</script>

<template>
  <article :aria-busy="petStore.loadingUpcoming">
    <header><h5>🔔 即将到期的事件 (7天内)</h5></header>

    <ul v-if="petStore.upcomingEvents.length">
      <li v-for="event in petStore.upcomingEvents" :key="event.id">
        <strong>{{ event.nextDueDate }}</strong> - 宠物ID {{ event.petId }} 需要: {{ event.notes || '执行事件' }}
      </li>
    </ul>
    <p v-else><i>太好了, 7天内没有需要提醒的事件。</i></p>
  </article>

  <br>

  <article :aria-busy="petStore.loadingList">
    <header>
      <h3>宠物列表</h3>
      <button @click="handleCreatePet">添加新宠物</button>
    </header>
    <table>
      <thead>
      <tr>
        <th scope="col">ID</th>
        <th scope="col">名字</th>
        <th scope="col">操作</th>
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
  </article>

</template>

<style scoped>
/* (无样式) */
</style>
