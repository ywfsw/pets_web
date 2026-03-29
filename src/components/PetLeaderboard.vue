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
  NIcon
} from 'naive-ui';
import { TrophyOutline, HeartOutline } from '@vicons/ionicons5';

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

// 排名徽章样式
const getRankBadge = (index) => {
  const badges = [
    { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', shadow: '0 4px 15px rgba(255, 215, 0, 0.4)' },
    { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', shadow: '0 4px 15px rgba(192, 192, 192, 0.4)' },
    { bg: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)', shadow: '0 4px 15px rgba(205, 127, 50, 0.4)' }
  ];
  return badges[index] || badges[0];
};

const getRankEmoji = (index) => {
  return ['🥇', '🥈', '🥉'][index] || '';
};
</script>

<template>
  <n-card class="leaderboard-card" :bordered="false">
    <template #header>
      <n-space align="center" :size="8">
        <n-icon :component="TrophyOutline" size="22" color="#FFD700" />
        <span class="leaderboard-title">🏆 萌宠点赞榜</span>
      </n-space>
    </template>

    <template v-if="loadingLeaderboard">
      <n-space vertical>
        <n-skeleton text style="width: 100%" />
        <n-skeleton text style="width: 100%" />
        <n-skeleton text style="width: 100%" />
      </n-space>
    </template>

    <template v-else-if="top3Pets.length > 0">
      <div class="leaderboard-content">
        <!-- 第一名 -->
        <div class="rank-item rank-1">
          <div class="avatar-wrapper" :style="{ background: getRankBadge(0).bg, boxShadow: getRankBadge(0).shadow }">
            <n-avatar
              round
              :size="72"
              :src="getAvatarUrl(top3Pets[0].profileImageUrl)"
              :fallback-src="fallbackAvatar"
            />
            <span class="rank-badge rank-1-badge">{{ getRankEmoji(0) }}</span>
          </div>
          <n-text strong class="pet-name">{{ top3Pets[0].name }}</n-text>
          <n-space align="center" :size="4">
            <n-icon :component="HeartOutline" size="14" color="#FF6B8A" />
            <n-text depth="3">{{ top3Pets[0].likeCount }} 赞</n-text>
          </n-space>
        </div>

        <!-- 第二名和第三名 -->
        <div class="rank-others">
          <template v-if="top3Pets[1]">
            <div class="rank-item rank-2">
              <div class="avatar-wrapper" :style="{ background: getRankBadge(1).bg, boxShadow: getRankBadge(1).shadow }">
                <n-avatar
                  round
                  :size="56"
                  :src="getAvatarUrl(top3Pets[1].profileImageUrl)"
                  :fallback-src="fallbackAvatar"
                />
                <span class="rank-badge rank-2-badge">{{ getRankEmoji(1) }}</span>
              </div>
              <n-text strong class="pet-name">{{ top3Pets[1].name }}</n-text>
              <n-space align="center" :size="4">
                <n-icon :component="HeartOutline" size="12" color="#FF6B8A" />
                <n-text depth="3">{{ top3Pets[1].likeCount }} 赞</n-text>
              </n-space>
            </div>
          </template>

          <template v-if="top3Pets[2]">
            <div class="rank-item rank-3">
              <div class="avatar-wrapper" :style="{ background: getRankBadge(2).bg, boxShadow: getRankBadge(2).shadow }">
                <n-avatar
                  round
                  :size="56"
                  :src="getAvatarUrl(top3Pets[2].profileImageUrl)"
                  :fallback-src="fallbackAvatar"
                />
                <span class="rank-badge rank-3-badge">{{ getRankEmoji(2) }}</span>
              </div>
              <n-text strong class="pet-name">{{ top3Pets[2].name }}</n-text>
              <n-space align="center" :size="4">
                <n-icon :component="HeartOutline" size="12" color="#FF6B8A" />
                <n-text depth="3">{{ top3Pets[2].likeCount }} 赞</n-text>
              </n-space>
            </div>
          </template>
        </div>
      </div>
    </template>

    <n-text v-else depth="3" style="display: block; text-align: center; padding: 20px;">
      暂无数据，快去点赞吧～
    </n-text>
  </n-card>
</template>

<style scoped>
.leaderboard-card {
  background: linear-gradient(135deg, #FFF9F5 0%, #FFF5F7 100%);
  border-radius: 20px;
  border: none;
}

.leaderboard-title {
  font-size: 18px;
  font-weight: 700;
  color: #2D2D2D;
}

.leaderboard-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.rank-others {
  display: flex;
  justify-content: center;
  gap: 48px;
}

.rank-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.avatar-wrapper {
  position: relative;
  border-radius: 50%;
  padding: 4px;
}

.rank-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.pet-name {
  font-size: 16px;
  color: #4A4A4A;
  margin-top: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .rank-others {
    gap: 24px;
  }

  .avatar-wrapper {
    padding: 3px;
  }

  .rank-1 .avatar-wrapper {
    width: 80px;
    height: 80px;
  }

  .rank-2 .avatar-wrapper,
  .rank-3 .avatar-wrapper {
    width: 62px;
    height: 62px;
  }
}
</style>
