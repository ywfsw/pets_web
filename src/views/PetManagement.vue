<script setup>
import { usePetStore } from '@/stores/petStore.js';
import PetLeaderboard from '@/components/PetLeaderboard.vue'; // (❗) 导入组件
const petStore = usePetStore();

// (Handlers)
const handleCreatePet = () => { petStore.showPetFormModal(null); };
const handleShowDetail = (petId) => { petStore.showDetailModal(petId); };

</script>

<template>
  <!-- (❗) 使用 PetLeaderboard 组件 -->
  <PetLeaderboard />

  <article :aria-busy="petStore.loadingUpcoming">
    <header><h5>🔔 即将到期的事件 (7天内)</h5></header>
    <ul v-if="petStore.upcomingEvents.length">
      <li v-for="event in petStore.upcomingEvents" :key="event.id">
        <strong>{{ event.nextDueDate }}</strong> - 宠物ID {{ event.petId }} 需要: {{ event.notes || '执行事件' }}
      </li>
    </ul>
    <p v-else><i>太好了, 7天内没有需要提醒的事件。</i></p>
  </article>

  <article :aria-busy="petStore.loadingList">
    <header>
      <h3>宠物列表</h3>
      <button @click="handleCreatePet">添加新宠物</button>
    </header>
    <table>
      <tbody>
      <tr v-for="pet in petStore.petList" :key="pet.id">

        <td>
          <a href="#" @click.prevent="handleShowDetail(pet.id)" class="pet-info-link">
            <div class="pet-name-avatar-wrapper">
              <strong>
                {{ pet.name }}
              </strong>
              <img v-if="pet.profileImageUrl" :src="pet.profileImageUrl" alt="Pet Avatar" class="pet-avatar">
            </div>
          </a>
        </td>

        <td>
          <div class="grid" style="--pico-grid-spacing: 0.5rem;">

            <button
              class="heart-button" @click="petStore.handleLike(pet.id)"
              :disabled="petStore.likingPetIds.has(pet.id)"
            >
              <svg
                class="heart-svg"
                :class="{ 'is-beating': petStore.likingPetIds.has(pet.id) }"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="18px"
                height="18px">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>{{ pet.likeCount }}</span>
            </button>

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
</template>

<style scoped>
/* (❗ 核心修改区域 ❗) */
.heart-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem; /* 间距 */
  padding: 0.2rem 0.6rem; /* 稍微调整 padding */

  background-color: transparent; /* (❗) 完全透明背景 */
  border: none; /* (❗) 移除所有边框 */
  color: #e53935; /* (❗) 数字颜色变为红色 */
  cursor: pointer; /* 保持指针样式 */
  transition: all 0.2s ease-in-out; /* 添加过渡效果 */

  /* 移除之前 Pico 相关的样式，确保完全透明 */
  --pico-outline-color: transparent;
  --pico-background-color: transparent;
  --pico-form-element-border-color: transparent;
}

/* 鼠标悬停时的样式 (可以添加一个轻微的背景色或改变文字颜色) */
.heart-button:hover:not(:disabled) {
  /* background-color: rgba(229, 57, 53, 0.1);  鼠标悬停时轻微的红色背景 */
  color: #c62828; /* 悬停时颜色稍微深一点 */
}

/* 禁用时的样式 */
.heart-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: transparent; /* 禁用时也保持透明 */
  border: none;
  color: #e53935; /* 禁用时数字也保持红色 */
}

.heart-svg {
  fill: #e53935; /* (❗) 默认颜色就是红色 */
  transform: scale(1);
  position: relative;
  top: -1px;
  transition: fill 0.2s ease-in-out; /* 填充颜色过渡 */
}

.heart-svg.is-beating {
  animation: heart-beat 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  fill: #f44336; /* 点赞时依然使用鲜艳的红色，可以稍微调整 */
}

@keyframes heart-beat {
  0% { transform: scale(1); }
  50% { transform: scale(1.5); }
  100% { transform: scale(1); }
}

.pet-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  vertical-align: middle;
}

.pet-name-avatar-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Pushes avatar to the right */
}

.pet-info-link {
  text-decoration: none; /* Keep only this */
  display: block; /* Make it a block element to take full width of td */
}

td > strong > a {
  color: var(--pico-primary);
  text-decoration: underline;
}

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
