<script setup>
import { onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePetStore } from '@/stores/petStore';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import {
  NCard,
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

const top3Pets = computed(() => {
  return petLeaderboard.value.slice(0, 3);
});

const fallbackAvatar = 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg';

</script>

<template>
  <n-card title="🏆 点赞排行榜" :loading="loadingLeaderboard">
    <template v-if="loadingLeaderboard">
      <n-space vertical>
        <n-skeleton text style="width: 100%" />
        <n-skeleton text style="width: 100%" />
        <n-skeleton text style="width: 100%" />
      </n-space>
    </template>
    <template v-else-if="top3Pets.length > 0">
      <n-space vertical :size="24" justify="center" align="center">
        <!-- First row: 1st place -->
        <n-space justify="center" align="center">
          <template v-if="top3Pets[0]">
            <n-space vertical align="center">
              <n-avatar
                round
                :size="80"
                :src="getAvatarUrl(top3Pets[0].profileImageUrl)"
                :fallback-src="fallbackAvatar"
              />
              <n-text strong>{{ top3Pets[0].name }}</n-text>
              <n-text depth="3">🥇</n-text>
            </n-space>
          </template>
        </n-space>

        <!-- Second row: 2nd and 3rd place -->
        <n-space justify="center" align="center" :size="80" style="width: 100%;">
          <template v-if="top3Pets[1]">
            <n-space vertical align="center">
              <n-avatar
                round
                :size="60"
                :src="getAvatarUrl(top3Pets[1].profileImageUrl)"
                :fallback-src="fallbackAvatar"
              />
              <n-text strong>{{ top3Pets[1].name }}</n-text>
              <n-text depth="3">🥈</n-text>
            </n-space>
          </template>
          <template v-if="top3Pets[2]">
            <n-space vertical align="center">
              <n-avatar
                round
                :size="60"
                :src="getAvatarUrl(top3Pets[2].profileImageUrl)"
                :fallback-src="fallbackAvatar"
              />
              <n-text strong>{{ top3Pets[2].name }}</n-text>
              <n-text depth="3">🥉</n-text>
            </n-space>
          </template>
        </n-space>
      </n-space>
    </template>
    <n-text v-else depth="3">暂无数据</n-text>
  </n-card>
</template>
