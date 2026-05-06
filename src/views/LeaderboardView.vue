<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePetStore } from '@/stores/petStore';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import { likePet } from '@/api.js';
import {
  NAvatar,
  NSkeleton,
  NIcon,
  NButton
} from 'naive-ui';
import { HeartOutline } from '@vicons/ionicons5';

const petStore = usePetStore();
const { fullLeaderboard, loadingFullLeaderboard } = storeToRefs(petStore);
const { getAvatarUrl } = useCloudinaryImage();

const heroVisible = ref(false);
const podiumVisible = ref(false);
const listVisible = ref(false);

onMounted(async () => {
  await petStore.loadFullLeaderboard();
  setTimeout(() => { heroVisible.value = true; }, 100);
  setTimeout(() => { podiumVisible.value = true; }, 400);
  setTimeout(() => { listVisible.value = true; }, 700);
});

const fallbackAvatar = 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg';

const podiumOrder = [1, 0, 2]; // index in fullLeaderboard: 2nd, 1st, 3rd

const podiumConfig = [
  { rank: 2, label: '🥈', height: 130, gradFrom: '#C0C0C0', gradTo: '#E8E8E8', shadow: 'rgba(192, 192, 192, 0.3)', nameBg: 'linear-gradient(135deg, #E8E8E8, #D0D0D0)' },
  { rank: 1, label: '🥇', height: 170, gradFrom: '#FFD700', gradTo: '#FFC107', shadow: 'rgba(255, 215, 0, 0.4)', nameBg: 'linear-gradient(135deg, #FFF8E1, #FFE082)' },
  { rank: 3, label: '🥉', height: 100, gradFrom: '#CD7F32', gradTo: '#DEB887', shadow: 'rgba(205, 127, 50, 0.3)', nameBg: 'linear-gradient(135deg, #EFEBE9, #D7CCC8)' }
];

const handleLike = async (pet) => {
  const id = pet.petId || pet.id;
  pet.likeCount++;
  try {
    await likePet(id);
  } catch {
    pet.likeCount--;
  }
};

const remainingPets = (pets) => {
  return pets ? pets.slice(3) : [];
};
</script>

<template>
  <div class="leaderboard-page">
    <!-- 沉浸式 Hero 区域 -->
    <div class="lb-hero" :class="{ visible: heroVisible }">
      <div class="lb-hero-bg" />
      <div class="lb-hero-inner">
        <div class="lb-hero-decorations">
          <span class="lb-shape s1">🏆</span>
          <span class="lb-shape s2">✨</span>
          <span class="lb-shape s3">👑</span>
          <span class="lb-shape s4">⭐</span>
          <span class="lb-shape s5">🌟</span>
          <span class="lb-shape s6">💫</span>
        </div>
        <div class="lb-hero-content">
          <div class="lb-hero-trophy">🏆</div>
          <h1 class="lb-hero-title">萌宠点赞排行榜</h1>
          <p class="lb-hero-subtitle">人气最高的小可爱都在这里啦</p>
          <div v-if="fullLeaderboard.length > 0" class="lb-hero-stats">
            <div class="lb-stat">
              <span class="lb-stat-num">{{ fullLeaderboard.length }}</span>
              <span class="lb-stat-label">只参赛萌宠</span>
            </div>
            <div class="lb-stat-divider" />
            <div class="lb-stat">
              <span class="lb-stat-num">{{ fullLeaderboard.reduce((sum, p) => sum + (p.likeCount || 0), 0) }}</span>
              <span class="lb-stat-label">累计点赞</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载态 -->
    <div v-if="loadingFullLeaderboard" class="lb-loading">
      <div class="podium-skeleton">
        <div v-for="i in 3" :key="i" class="podium-skel-item">
          <n-skeleton circle :size="64" />
          <n-skeleton text style="width: 80px; margin-top: 12px;" />
          <n-skeleton text style="width: 50px; margin-top: 8px;" />
          <n-skeleton :style="{ height: [100, 140, 80][i-1] + 'px', borderRadius: '12px 12px 0 0' }" />
        </div>
      </div>
      <div class="list-skeleton">
        <n-skeleton v-for="i in 4" :key="i" :height="68" style="border-radius: 16px; margin-bottom: 12px;" />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="fullLeaderboard.length === 0 && !loadingFullLeaderboard" class="lb-empty">
      <div class="lb-empty-card">
        <div class="lb-empty-icon">🐾</div>
        <div class="lb-empty-sparkle">✨</div>
        <p class="lb-empty-title">暂无萌宠参赛</p>
        <p class="lb-empty-desc">快去添加萌宠并为它们点赞吧！</p>
      </div>
    </div>

    <!-- 排行榜内容 -->
    <template v-else>
      <!-- Top 3 领奖台 -->
      <div v-if="fullLeaderboard.length >= 3" class="podium-section" :class="{ visible: podiumVisible }">
        <div class="podium-row">
          <div
            v-for="(idx, pos) in podiumOrder"
            :key="fullLeaderboard[idx].petId || fullLeaderboard[idx].id"
            class="podium-item"
            :class="`podium-rank-${podiumConfig[pos].rank}`"
          >
            <div class="podium-avatar-ring" :style="{ '--ring-color': podiumConfig[pos].gradFrom }">
              <n-avatar
                round
                :size="pos === 1 ? 80 : 64"
                :src="getAvatarUrl(fullLeaderboard[idx].profileImageUrl)"
                :fallback-src="fallbackAvatar"
                class="podium-avatar"
              />
              <span class="podium-badge">{{ podiumConfig[pos].label }}</span>
            </div>
            <div class="podium-name">{{ fullLeaderboard[idx].name }}</div>
            <div v-if="fullLeaderboard[idx].speciesName" class="podium-species">
              {{ fullLeaderboard[idx].speciesName }}{{ fullLeaderboard[idx].breedName ? ' · ' + fullLeaderboard[idx].breedName : '' }}
            </div>
            <div class="podium-likes">
              <span class="podium-heart">❤️</span>
              <span class="podium-like-num">{{ fullLeaderboard[idx].likeCount }}</span>
            </div>
            <n-button
              size="small"
              round
              class="podium-like-btn"
              :style="{ '--btn-color': podiumConfig[pos].gradFrom }"
              @click="handleLike(fullLeaderboard[idx])"
            >
              <template #icon>
                <n-icon :component="HeartOutline" />
              </template>
              为它点赞
            </n-button>
            <div
              class="podium-pedestal"
              :style="{
                height: podiumConfig[pos].height + 'px',
                '--ped-from': podiumConfig[pos].gradFrom,
                '--ped-to': podiumConfig[pos].gradTo,
                '--ped-shadow': podiumConfig[pos].shadow
              }"
            >
              <span class="pedestal-rank-num">{{ podiumConfig[pos].rank }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 其他排名列表 -->
      <div v-if="remainingPets(fullLeaderboard).length > 0" class="list-section" :class="{ visible: listVisible }">
        <div class="list-section-title">
          <span class="list-title-line" />
          <span class="list-title-text">完整排名</span>
          <span class="list-title-line" />
        </div>
        <div class="lb-list">
          <div
            v-for="(pet, i) in remainingPets(fullLeaderboard)"
            :key="pet.petId || pet.id"
            class="lb-list-item"
            :style="{ animationDelay: `${i * 60}ms` }"
          >
            <span class="lb-list-rank">{{ i + 4 }}</span>
            <n-avatar
              round
              :size="44"
              :src="getAvatarUrl(pet.profileImageUrl)"
              :fallback-src="fallbackAvatar"
              class="lb-list-avatar"
            />
            <div class="lb-list-info">
              <span class="lb-list-name">{{ pet.name }}</span>
              <span v-if="pet.speciesName" class="lb-list-species">
                {{ pet.speciesName }}{{ pet.breedName ? ' · ' + pet.breedName : '' }}
              </span>
            </div>
            <div class="lb-list-likes">
              <span class="lb-list-heart">❤️</span>
              <span class="lb-list-like-num">{{ pet.likeCount }}</span>
            </div>
            <n-button
              size="small"
              quaternary
              round
              type="error"
              class="lb-list-like-btn"
              @click="handleLike(pet)"
            >
              <template #icon>
                <n-icon :component="HeartOutline" />
              </template>
            </n-button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.leaderboard-page {
  max-width: 820px;
  margin: 0 auto;
}

/* ============ Hero ============ */
.lb-hero {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 32px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.lb-hero.visible {
  opacity: 1;
  transform: translateY(0);
}

.lb-hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #FFD700 0%, #FF9BA8 35%, #C084FC 70%, #7DD3FC 100%);
  opacity: 0.95;
}
:global(.dark-mode) .lb-hero-bg {
  background: linear-gradient(135deg, #B8860B 0%, #CC3355 35%, #7B2FBE 70%, #2980B9 100%);
}

.lb-hero-inner {
  position: relative;
  padding: 48px 32px 40px;
  backdrop-filter: blur(2px);
}

/* Decorations */
.lb-hero-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.lb-shape {
  position: absolute;
  font-size: 24px;
  opacity: 0.25;
  animation: float-shape 6s ease-in-out infinite;
}
.lb-shape.s1 { top: 10%; left: 8%; animation-delay: 0s; font-size: 32px; }
.lb-shape.s2 { top: 15%; right: 12%; animation-delay: 1.2s; }
.lb-shape.s3 { bottom: 20%; left: 18%; animation-delay: 0.6s; font-size: 28px; }
.lb-shape.s4 { bottom: 15%; right: 8%; animation-delay: 1.8s; }
.lb-shape.s5 { top: 40%; left: 4%; animation-delay: 2.4s; font-size: 18px; }
.lb-shape.s6 { top: 50%; right: 5%; animation-delay: 3s; font-size: 20px; }

@keyframes float-shape {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(5deg); }
  50% { transform: translateY(-3px) rotate(-3deg); }
  75% { transform: translateY(-10px) rotate(3deg); }
}

.lb-hero-content {
  position: relative;
  text-align: center;
  z-index: 1;
}

.lb-hero-trophy {
  font-size: 56px;
  margin-bottom: 12px;
  animation: trophy-bounce 2s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(255, 215, 0, 0.5));
}
@keyframes trophy-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.05); }
}

.lb-hero-title {
  font-size: 36px;
  font-weight: 800;
  color: white;
  margin: 0 0 8px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  letter-spacing: 2px;
}

.lb-hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 24px;
  font-weight: 500;
}

.lb-hero-stats {
  display: inline-flex;
  align-items: center;
  gap: 24px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 12px 28px;
}
.lb-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.lb-stat-num {
  font-size: 28px;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.lb-stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
  font-weight: 500;
}
.lb-stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.3);
}

/* ============ Podium ============ */
.podium-section {
  margin-bottom: 36px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.podium-section.visible {
  opacity: 1;
  transform: translateY(0);
}

.podium-row {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 16px;
  padding: 0 8px;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 220px;
}

.podium-avatar-ring {
  position: relative;
  margin-bottom: 12px;
}

.podium-avatar {
  border: 3px solid var(--ring-color, #FFD700);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}
.podium-avatar:hover {
  transform: scale(1.08);
}

.podium-badge {
  position: absolute;
  bottom: -6px;
  right: -6px;
  font-size: 28px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.podium-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--pet-text-primary, #2D2D2D);
  text-align: center;
  margin-bottom: 2px;
}
:global(.dark-mode) .podium-name { color: #FFFFFF; }

.podium-species {
  font-size: 12px;
  color: var(--pet-text-tertiary, #9CA3AF);
  text-align: center;
  margin-bottom: 8px;
}

.podium-likes {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}
.podium-heart {
  font-size: 14px;
}
.podium-like-num {
  font-size: 20px;
  font-weight: 800;
  color: #FF6B8A;
}

.podium-like-btn {
  margin-bottom: 12px;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
}
.podium-like-btn:hover {
  transform: scale(1.05);
}

.podium-pedestal {
  width: 100%;
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 16px;
  background: linear-gradient(180deg, var(--ped-from), var(--ped-to));
  box-shadow: 0 -4px 20px var(--ped-shadow);
  position: relative;
  overflow: hidden;
}
.podium-pedestal::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 60%);
  pointer-events: none;
}

.pedestal-rank-num {
  font-size: 36px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

/* ============ List Section ============ */
.list-section {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.list-section.visible {
  opacity: 1;
  transform: translateY(0);
}

.list-section-title {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.list-title-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--pet-border, #F0E6E0), transparent);
}
:global(.dark-mode) .list-title-line {
  background: linear-gradient(90deg, transparent, #3D3D5C, transparent);
}
.list-title-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--pet-text-tertiary, #9CA3AF);
  white-space: nowrap;
}

.lb-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lb-list-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 16px;
  background: var(--pet-card, #FFFFFF);
  border: 1px solid var(--pet-border, #F0E6E0);
  transition: all 0.3s ease;
  animation: list-item-enter 0.5s ease both;
}
@keyframes list-item-enter {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}
.lb-list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.12);
}

:global(.dark-mode) .lb-list-item {
  background: #252542;
  border-color: #3D3D5C;
}
:global(.dark-mode) .lb-list-item:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.lb-list-rank {
  font-size: 18px;
  font-weight: 800;
  color: var(--pet-text-tertiary, #C0C0C0);
  min-width: 28px;
  text-align: center;
}

.lb-list-avatar {
  flex-shrink: 0;
  border: 2px solid var(--pet-border, #F0E6E0);
}
:global(.dark-mode) .lb-list-avatar {
  border-color: #3D3D5C;
}

.lb-list-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.lb-list-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--pet-text-primary, #2D2D2D);
}
:global(.dark-mode) .lb-list-name { color: #E8E8E8; }
.lb-list-species {
  font-size: 12px;
  color: var(--pet-text-tertiary, #9CA3AF);
}

.lb-list-likes {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.lb-list-heart { font-size: 13px; }
.lb-list-like-num {
  font-size: 15px;
  font-weight: 700;
  color: #FF6B8A;
}

.lb-list-like-btn {
  flex-shrink: 0;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
}
.lb-list-like-btn:hover {
  transform: scale(1.1);
}

/* ============ Loading ============ */
.lb-loading {
  margin-top: 24px;
}
.podium-skeleton {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}
.podium-skel-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 220px;
}

.list-skeleton {
  margin-top: 16px;
}

/* ============ Empty ============ */
.lb-empty {
  padding: 60px 20px;
  text-align: center;
}
.lb-empty-card {
  position: relative;
  display: inline-block;
}
.lb-empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
.lb-empty-sparkle {
  position: absolute;
  top: -8px;
  right: -12px;
  font-size: 24px;
  animation: sparkle-pulse 2s ease-in-out infinite;
}
@keyframes sparkle-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.1); }
}
.lb-empty-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--pet-text-primary, #2D2D2D);
  margin: 0 0 8px;
}
:global(.dark-mode) .lb-empty-title { color: #E8E8E8; }
.lb-empty-desc {
  font-size: 14px;
  color: var(--pet-text-tertiary, #9CA3AF);
  margin: 0;
}

/* ============ Mobile ============ */
@media (max-width: 768px) {
  .lb-hero-inner {
    padding: 36px 20px 32px;
  }
  .lb-hero-trophy { font-size: 44px; }
  .lb-hero-title { font-size: 26px; letter-spacing: 1px; }
  .lb-hero-subtitle { font-size: 14px; }
  .lb-hero-stats { gap: 16px; padding: 10px 20px; }
  .lb-stat-num { font-size: 22px; }

  .podium-row { gap: 8px; }
  .podium-item { max-width: 180px; }
  .podium-avatar :deep(.n-avatar) { width: 56px !important; height: 56px !important; }
  .podium-rank-1 .podium-avatar :deep(.n-avatar) { width: 68px !important; height: 68px !important; }
  .podium-name { font-size: 14px; }
  .podium-like-num { font-size: 17px; }
  .podium-pedestal { height: auto !important; }
  .podium-rank-1 .podium-pedestal { height: 120px !important; }
  .podium-rank-2 .podium-pedestal { height: 90px !important; }
  .podium-rank-3 .podium-pedestal { height: 70px !important; }
  .pedestal-rank-num { font-size: 28px; }

  .lb-list-item {
    padding: 12px 14px;
    gap: 10px;
  }
  .lb-list-rank { font-size: 16px; min-width: 24px; }
  .lb-list-name { font-size: 14px; }
  .lb-list-like-num { font-size: 13px; }
}

@media (max-width: 480px) {
  .lb-hero-inner { padding: 28px 16px 24px; }
  .lb-hero-trophy { font-size: 36px; }
  .lb-hero-title { font-size: 22px; }
  .lb-hero-stats { gap: 12px; padding: 8px 16px; }
  .lb-stat-num { font-size: 18px; }
  .lb-stat-label { font-size: 11px; }

  .podium-row { gap: 4px; }
  .podium-item { max-width: 140px; }
  .podium-badge { font-size: 22px; }
  .podium-like-btn { font-size: 11px !important; }
}
</style>
