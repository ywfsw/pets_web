<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePetStore } from '@/stores/petStore';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import {
  NCard,
  NList,
  NListItem,
  NThing,
  NAvatar,
  NText,
  NSkeleton,
  NSpace,
} from 'naive-ui';

const petStore = usePetStore();
const { petLeaderboard, loadingLeaderboard } = storeToRefs(petStore);
const { getAvatarUrl } = useCloudinaryImage();

onMounted(() => {
  petStore.loadPetLeaderboard();
});

const getTrophy = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};
</script>

<template>
  <n-card title="🏆 点赞排行榜">
    <div v-if="loadingLeaderboard">
      <n-space vertical>
        <n-skeleton text style="width: 100%" />
        <n-skeleton text style="width: 100%" />
        <n-skeleton text style="width: 100%" />
      </n-space>
    </div>
    <n-list v-else-if="petLeaderboard.length > 0" hoverable clickable>
      <n-list-item v-for="pet in petLeaderboard" :key="pet.petId">
        <n-thing>
          <template #avatar>
            <n-avatar round :src="getAvatarUrl(pet.avatarUrl)" />
          </template>
          <template #header>
            {{ pet.name }}
          </template>
          <template #header-extra>
            <n-text type="success">
              {{ pet.likeCount }} ❤️
            </n-text>
          </template>
          <template #description>
            <n-text depth="3">
              排名: {{ getTrophy(pet.rank) }}
            </n-text>
          </template>
        </n-thing>
      </n-list-item>
    </n-list>
    <n-text v-else depth="3">暂无数据</n-text>
  </n-card>
</template>
