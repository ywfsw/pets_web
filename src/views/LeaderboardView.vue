<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { usePetStore } from '@/stores/petStore';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import { likePet } from '@/api.js';
import {
  NCard,
  NAvatar,
  NText,
  NSkeleton,
  NSpace,
  NIcon,
  NButton,
  NEmpty
} from 'naive-ui';
import { TrophyOutline, HeartOutline, PawOutline } from '@vicons/ionicons5';

const petStore = usePetStore();
const { fullLeaderboard, loadingFullLeaderboard } = storeToRefs(petStore);
const { getAvatarUrl } = useCloudinaryImage();

onMounted(() => {
  petStore.loadFullLeaderboard();
});

const fallbackAvatar = 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg';

const getRankBadge = (index) => {
  const badges = [
    { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', shadow: '0 4px 15px rgba(255, 215, 0, 0.4)', color: '#B8860B' },
    { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', shadow: '0 4px 15px rgba(192, 192, 192, 0.4)', color: '#808080' },
    { bg: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)', shadow: '0 4px 15px rgba(205, 127, 50, 0.4)', color: '#8B4513' }
  ];
  return badges[index] || { bg: 'transparent', shadow: 'none', color: 'inherit' };
};

const getRankEmoji = (index) => {
  return ['🥇', '🥈', '🥉'][index] || `${index + 1}`;
};

const handleLike = async (pet) => {
  const id = pet.petId || pet.id;
  // 乐观更新排行榜数据
  pet.likeCount++;
  try {
    await likePet(id);
  } catch {
    pet.likeCount--;
  }
};
</script>

<template>
  <div class="leaderboard-page">
    <div class="leaderboard-header">
      <n-space align="center" :size="12">
        <n-icon :component="TrophyOutline" size="32" color="#FFD700" />
        <h1 class="page-title">萌宠点赞排行榜</h1>
      </n-space>
      <n-text depth="3" class="page-subtitle">看看谁是最受欢迎的萌宠吧～</n-text>
    </div>

    <!-- 加载态 -->
    <div v-if="loadingFullLeaderboard" class="leaderboard-list">
      <n-card v-for="i in 5" :key="i" class="rank-card skeleton-card" :bordered="false">
        <n-space align="center" :size="16">
          <n-skeleton circle :size="48" />
          <n-space vertical :size="8">
            <n-skeleton text style="width: 120px" />
            <n-skeleton text style="width: 80px" />
          </n-space>
        </n-space>
      </n-card>
    </div>

    <!-- 空状态 -->
    <div v-else-if="fullLeaderboard.length === 0" class="empty-state">
      <n-empty description="暂无宠物数据，快去添加萌宠吧～" size="large">
        <template #icon>
          <n-icon :component="PawOutline" size="48" color="#FF9BA8" />
        </template>
      </n-empty>
    </div>

    <!-- 排行榜列表 -->
    <div v-else class="leaderboard-list">
      <div
        v-for="(pet, index) in fullLeaderboard"
        :key="pet.petId || pet.id"
        class="rank-card"
        :class="{
          'rank-gold': index === 0,
          'rank-silver': index === 1,
          'rank-bronze': index === 2
        }"
      >
        <!-- 排名 -->
        <div class="rank-number" :class="{ 'rank-top3': index < 3 }">
          <span v-if="index < 3" class="rank-emoji">{{ getRankEmoji(index) }}</span>
          <span v-else class="rank-text">{{ index + 1 }}</span>
        </div>

        <!-- 头像 -->
        <div class="rank-avatar" :style="index < 3 ? { background: getRankBadge(index).bg, boxShadow: getRankBadge(index).shadow } : {}">
          <n-avatar
            round
            :size="index === 0 ? 64 : 52"
            :src="getAvatarUrl(pet.profileImageUrl)"
            :fallback-src="fallbackAvatar"
          />
        </div>

        <!-- 信息 -->
        <div class="rank-info">
          <n-text strong class="rank-pet-name">{{ pet.name }}</n-text>
          <n-text v-if="pet.speciesName" depth="3" class="rank-pet-species">{{ pet.speciesName }}{{ pet.breedName ? ' · ' + pet.breedName : '' }}</n-text>
        </div>

        <!-- 点赞数和按钮 -->
        <div class="rank-like-area">
          <n-space align="center" :size="6" class="like-count">
            <n-icon :component="HeartOutline" :size="16" color="#FF6B8A" />
            <n-text strong class="like-number">{{ pet.likeCount }}</n-text>
          </n-space>
          <n-button
            size="small"
            quaternary
            type="error"
            class="like-btn"
            @click="handleLike(pet)"
          >
            <template #icon>
              <n-icon :component="HeartOutline" />
            </template>
            点赞
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-page {
  max-width: 720px;
  margin: 0 auto;
}

.leaderboard-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #FFD700 0%, #FF9BA8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  display: block;
  margin-top: 4px;
  font-size: 14px;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--pet-card, #fff);
  border: 1px solid var(--pet-border, #F0E6E0);
  transition: all 0.3s ease;
}

.rank-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 155, 168, 0.15);
}

.rank-gold {
  border-color: #FFD700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 165, 0, 0.04) 100%);
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.15);
}

.rank-silver {
  border-color: #C0C0C0;
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.08) 0%, rgba(168, 168, 168, 0.04) 100%);
}

.rank-bronze {
  border-color: #CD7F32;
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.08) 0%, rgba(184, 115, 51, 0.04) 100%);
}

.rank-number {
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-emoji {
  font-size: 28px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

.rank-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--pet-text-tertiary, #9CA3AF);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--pet-bg-secondary, #F9FAFB);
}

.rank-avatar {
  border-radius: 50%;
  padding: 3px;
  flex-shrink: 0;
}

.rank-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rank-pet-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--pet-text-primary, #2D2D2D);
}

.rank-pet-species {
  font-size: 13px;
}

.rank-like-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.like-count {
  display: flex;
  align-items: center;
}

.like-number {
  font-size: 16px;
  font-weight: 700;
  color: #FF6B8A;
}

.like-btn {
  border-radius: 16px !important;
  font-size: 12px !important;
}

.skeleton-card:hover {
  transform: none;
  box-shadow: none;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

/* 暗色主题 */
:global(.dark-mode) .rank-card {
  background: var(--pet-card, #252542);
  border-color: var(--pet-border, #3D3D5C);
}

:global(.dark-mode) .rank-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

:global(.dark-mode) .rank-gold {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%);
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.1);
}

:global(.dark-mode) .rank-pet-name {
  color: var(--pet-text-primary, #FFFFFF);
}

:global(.dark-mode) .rank-text {
  background: var(--pet-bg-secondary, #1F1F3A);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .page-title {
    font-size: 22px;
  }

  .rank-card {
    padding: 12px 14px;
    gap: 12px;
  }

  .rank-emoji {
    font-size: 22px;
  }

  .rank-text {
    font-size: 15px;
    width: 28px;
    height: 28px;
  }

  .rank-pet-name {
    font-size: 14px;
  }

  .rank-pet-species {
    font-size: 12px;
  }

  .like-number {
    font-size: 14px;
  }
}
</style>
