<template>
  <div class="pet-leaderboard">
    <h2><i class="fas fa-trophy"></i> 宠物点赞排行榜</h2>
    <div v-if="loadingLeaderboard" class="loading">
      <p>正在加载排行榜...</p>
    </div>
    <div v-else-if="petLeaderboard.length === 0" class="empty">
      <p>暂无数据</p>
    </div>
    <table v-else class="leaderboard-table">
      <thead>
        <tr>
          <th>排名</th>
          <th>宠物名</th>
          <th>点赞数</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="pet in petLeaderboard" :key="pet.petId">
          <td>
            <span v-if="pet.rank === 1">🥇</span>
            <span v-else-if="pet.rank === 2">🥈</span>
            <span v-else-if="pet.rank === 3">🥉</span>
            <span v-else>{{ pet.rank }}</span>
          </td>
          <td>{{ pet.name }}</td>
          <td>{{ pet.likeCount }} <i class="fas fa-heart"></i></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePetStore } from '@/stores/petStore';

const petStore = usePetStore();
const { petLeaderboard, loadingLeaderboard } = storeToRefs(petStore);

onMounted(() => {
  petStore.loadPetLeaderboard();
});
</script>

<style scoped>
.pet-leaderboard {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.loading, .empty {
  text-align: center;
  color: #666;
  padding: 20px;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th, .leaderboard-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.leaderboard-table th {
  background-color: #f2f2f2;
}

.leaderboard-table tbody tr:hover {
  background-color: #f5f5f5;
}

.fa-heart {
  color: #ff4d4f;
}

.fa-trophy {
  color: #ffc107;
}
</style>
