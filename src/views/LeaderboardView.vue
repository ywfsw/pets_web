<template>
  <div class="leaderboard-view">
    <PetLeaderboard />
  </div>
</template>

<script setup>
import PetLeaderboard from '@/components/PetLeaderboard.vue';
</script>

<style scoped>
.leaderboard-view {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}
</style>
