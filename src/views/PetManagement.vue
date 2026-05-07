<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import { useMessage } from 'naive-ui';

import {
  NButton,
  NAvatar,
  NTag,
  NPopconfirm,
  NIcon,
  NInput,
  NSelect,
  NPagination
} from 'naive-ui';
import { CreateOutline, CheckmarkCircleOutline, SearchOutline } from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();
const dictStore = useDictionaryStore();
const message = useMessage();
const { getAvatarUrl } = useCloudinaryImage();

// 性别选项
const genderOptions = [
  { label: '♂ 公', value: 'male' },
  { label: '♀ 母', value: 'female' }
];

// 年龄范围选项
const ageOptions = [
  { label: '🍼 幼崽 (< 1岁)', value: 'baby' },
  { label: '🐾 青年 (1-3岁)', value: 'young' },
  { label: '🐕 成年 (3-7岁)', value: 'adult' },
  { label: '🧓 老年 (7岁+)', value: 'senior' }
];

// 年龄 key → 标签映射
const ageLabelMap = { baby: '🍼 幼崽', young: '🐾 青年', adult: '🐕 成年', senior: '🧓 老年' };

// 排序选项
const sortOptions = [
  { label: '📋 默认排序', value: 'default' },
  { label: '🔤 名称 A-Z', value: 'name_asc' },
  { label: '❤️ 点赞最多', value: 'likes_desc' },
  { label: '🐣 年龄最小', value: 'age_asc' },
  { label: '🧓 年龄最大', value: 'age_desc' },
  { label: '🆕 最近添加', value: 'newest' }
];

// 物种选项（从字典中获取）
const speciesFilterOptions = computed(() => {
  return dictStore.species.map(s => ({ label: s.itemLabel, value: s.id }));
});

// 统计数据
const totalPets = computed(() => petStore.pagination.total || 0);
const speciesCount = computed(() => {
  const species = new Set(petStore.petList.map(p => p.speciesLabel).filter(Boolean));
  return species.size;
});
const maleCount = computed(() => petStore.petList.filter(p => p.gender === 'male').length);
const femaleCount = computed(() => petStore.petList.filter(p => p.gender === 'female').length);

// 时间感知问候
const timeEmoji = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return '🌙';
  if (h < 12) return '☀️';
  if (h < 18) return '🌅';
  return '🌙';
});

// Responsive logic
const isMobile = ref(false);
const mobileBreakpoint = 768;

const checkMobile = () => {
  isMobile.value = window.innerWidth < mobileBreakpoint;
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// Handlers
const handleCreatePet = () => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再添加宠物');
    return;
  }
  petStore.showPetFormModal(null);
};
const handleShowDetail = (petId) => { petStore.showDetailModal(petId); };
const handlePageChange = (page) => { petStore.loadPetList(page); };

// 编辑宠物
const handleEditPet = (pet) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再编辑宠物');
    return;
  }
  petStore.showPetFormModal(pet);
};

// 快捷操作：记录体重
const handleQuickWeight = (pet) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录');
    return;
  }
  petStore.showWeightLogFormModal(pet.id);
};

// 快捷操作：记录喂养
const handleQuickFeeding = (pet) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录');
    return;
  }
  petStore.showFeedingRecordFormModal(pet.id);
};

// 快捷操作：记录健康事件
const handleQuickHealth = (pet) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录');
    return;
  }
  petStore.showHealthEventFormModal(pet.id);
};

// 搜索防抖
let searchTimer = null;
const handleSearchInput = (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    petStore.setSearchKeyword(value);
  }, 400);
};

const handleClearSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  petStore.clearSearchKeyword();
};

// 计算宠物年龄
const computeAge = (birthday) => {
  if (!birthday) return null;
  const birth = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return null;
  if (years === 0 && months === 0) return '不到1个月';
  if (years === 0) return `${months}个月`;
  if (months === 0) return `${years}岁`;
  return `${years}岁${months}个月`;
};

// 事件提醒：获取剩余天数徽章样式
const getDaysBadgeClass = (daysLeft) => {
  if (daysLeft < 0) return 'days-overdue';
  if (daysLeft === 0) return 'days-today';
  if (daysLeft <= 2) return 'days-warning';
  return 'days-normal';
};

// 事件提醒：获取天数标签类型
const getDaysTagType = (daysLeft) => {
  if (daysLeft < 0) return 'error';
  if (daysLeft <= 2) return 'warning';
  return 'success';
};

// 事件提醒：获取天数文本
const getDaysText = (daysLeft) => {
  if (daysLeft < 0) return '天前';
  if (daysLeft === 0) return '今天';
  return '天后';
};

// 事件提醒：获取天数绝对值
const getDaysDisplay = (daysLeft) => {
  if (daysLeft < 0) return Math.abs(daysLeft);
  return daysLeft;
};

import { getEventTypeIcon } from '@/utils/eventTypeIcon.js';

// 标记事件为已完成
const handleCompleteEvent = async (eventId) => {
  if (!authStore.isAuthenticated) {
    message.warning('请先登录后再操作');
    return;
  }
  try {
    await petStore.handleCompleteHealthEvent(eventId);
    message.success('事件已标记为完成');
  } catch (error) {
    message.error('操作失败，请重试');
  }
};

// 处理点赞
const handleLike = async (petId) => {
  try {
    await petStore.handleLike(petId);
  } catch (error) {
    console.error('Failed to like pet:', error);
  }
};

</script>

<template>
  <div class="pet-management">
    <!-- 沉浸式 Hero 区域 -->
    <div class="hero-section">
      <div class="hero-border">
        <div class="hero-inner">
          <div class="hero-decoration">
            <span class="float-shape shape-1">🐾</span>
            <span class="float-shape shape-2">🐱</span>
            <span class="float-shape shape-3">✨</span>
            <span class="float-shape shape-4">🐶</span>
            <span class="float-shape shape-5">💕</span>
            <span class="float-shape shape-6">🌟</span>
          </div>
          <div class="hero-content">
            <div class="hero-greeting">
              <span class="hero-emoji">{{ timeEmoji }}</span>
              <h1 class="hero-title">
                <span class="title-gradient">萌宠家族</span>
              </h1>
            </div>
            <p class="hero-subtitle">管理你的毛孩子，记录每一个温馨瞬间</p>
            <div class="hero-stats-bar">
              <div class="hero-stat-item">
                <span class="hero-stat-value">{{ totalPets }}</span>
                <span class="hero-stat-label">宠物总数</span>
              </div>
              <div class="hero-stat-divider"></div>
              <div class="hero-stat-item">
                <span class="hero-stat-value">{{ speciesCount }}</span>
                <span class="hero-stat-label">物种种类</span>
              </div>
              <div class="hero-stat-divider"></div>
              <div class="hero-stat-item">
                <span class="hero-stat-value">{{ maleCount }}</span>
                <span class="hero-stat-label">♂ 小王子</span>
              </div>
              <div class="hero-stat-divider"></div>
              <div class="hero-stat-item">
                <span class="hero-stat-value">{{ femaleCount }}</span>
                <span class="hero-stat-label">♀ 小公主</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件提醒区域 -->
    <div class="section-entrance section-delay-2">
      <div class="event-section">
        <div class="section-header">
          <span class="section-icon">📅</span>
          <h2 class="section-title">事件提醒</h2>
          <span v-if="petStore.upcomingEvents.length" class="section-badge">{{ petStore.upcomingEvents.length }}</span>
        </div>
        <div v-if="petStore.loadingUpcoming" class="event-skeleton-list">
          <div v-for="i in 3" :key="i" class="event-skeleton-item">
            <div class="skeleton-badge"></div>
            <div class="skeleton-info">
              <div class="skeleton-line skeleton-line-short"></div>
              <div class="skeleton-line skeleton-line-long"></div>
            </div>
          </div>
        </div>
        <div v-else-if="petStore.upcomingEvents.length" class="event-list">
          <div
            v-for="(event, idx) in petStore.upcomingEvents"
            :key="event.id"
            class="event-item"
            :class="{ 'event-overdue': event.isOverdue }"
            :style="{ animationDelay: `${idx * 60}ms` }"
            @click="handleShowDetail(event.petId)"
          >
            <div class="event-days-badge" :class="getDaysBadgeClass(event.daysLeft)">
              <span class="event-days-number">{{ getDaysDisplay(event.daysLeft) }}</span>
              <span class="event-days-text">{{ getDaysText(event.daysLeft) }}</span>
            </div>
            <div class="event-info">
              <div class="event-info-top">
                <span class="event-pet-name">{{ event.petName }}</span>
                <span class="event-type-icon">{{ getEventTypeIcon(event.eventTypeLabel) }}</span>
                <n-tag :type="getDaysTagType(event.daysLeft)" size="small" round>
                  {{ event.eventTypeLabel }}
                </n-tag>
              </div>
              <div class="event-info-bottom">
                <span class="event-notes">{{ event.notes || '待处理' }}</span>
                <span class="event-date">{{ event.nextDueDate }}</span>
              </div>
            </div>
            <n-popconfirm
              @positive-click="handleCompleteEvent(event.id)"
              :positive-button-props="{ type: 'success', size: 'tiny' }"
              :negative-button-props="{ size: 'tiny' }"
            >
              <template #trigger>
                <n-button
                  text
                  type="success"
                  size="tiny"
                  class="event-complete-btn"
                  :disabled="!authStore.isAuthenticated"
                  @click.stop
                >
                  <template #icon>
                    <n-icon :component="CheckmarkCircleOutline" :size="18" />
                  </template>
                </n-button>
              </template>
              标记此事件为已完成？
            </n-popconfirm>
            <span class="event-arrow">›</span>
          </div>
        </div>
        <div v-else class="custom-empty">
          <div class="empty-icon-bounce">🎉</div>
          <p class="empty-text">太棒了！没有需要提醒的事件～</p>
          <div class="empty-stars">
            <span class="star-blink">✨</span>
            <span class="star-blink delay-1">⭐</span>
            <span class="star-blink delay-2">✨</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选工具栏 -->
    <div class="section-entrance section-delay-3">
      <div class="toolbar-section">
        <div class="toolbar-row">
          <n-input
            :value="petStore.searchKeyword"
            @update:value="handleSearchInput"
            placeholder="搜索名称或备注..."
            clearable
            size="small"
            @clear="handleClearSearch"
            class="pet-search-input"
          >
            <template #prefix>
              <n-icon :component="SearchOutline" size="16" />
            </template>
          </n-input>
          <n-select
            :value="petStore.speciesFilter"
            :options="speciesFilterOptions"
            placeholder="物种"
            clearable
            size="small"
            class="pet-filter-select"
            @update:value="petStore.setSpeciesFilter"
          />
          <n-select
            :value="petStore.genderFilter"
            :options="genderOptions"
            placeholder="性别"
            clearable
            size="small"
            class="pet-filter-select"
            @update:value="petStore.setGenderFilter"
          />
          <n-select
            :value="petStore.ageFilter"
            :options="ageOptions"
            placeholder="年龄"
            clearable
            size="small"
            class="pet-filter-select"
            @update:value="petStore.setAgeFilter"
          />
          <n-select
            :value="petStore.sortOption"
            :options="sortOptions"
            placeholder="排序"
            size="small"
            class="pet-sort-select"
            @update:value="petStore.setSortOption"
          />
          <n-button
            @click="handleCreatePet"
            type="primary"
            class="add-pet-btn"
          >
            <template #icon>
              <n-icon>+</n-icon>
            </template>
            添加新萌宠
          </n-button>
        </div>
        <div v-if="petStore.searchKeyword || petStore.speciesFilter || petStore.genderFilter || petStore.ageFilter || petStore.sortOption !== 'default'" class="active-filters">
          <n-tag v-if="petStore.searchKeyword" size="small" round closable @close="handleClearSearch" class="filter-tag">
            🔍 {{ petStore.searchKeyword }}
          </n-tag>
          <n-tag v-if="petStore.speciesFilter" size="small" round type="info" closable @close="petStore.clearSpeciesFilter" class="filter-tag">
            🐾 {{ dictStore.species.find(s => s.id === petStore.speciesFilter)?.itemLabel }}
          </n-tag>
          <n-tag v-if="petStore.genderFilter" size="small" round type="warning" closable @close="petStore.clearGenderFilter" class="filter-tag">
            {{ petStore.genderFilter === 'male' ? '♂ 公' : '♀ 母' }}
          </n-tag>
          <n-tag v-if="petStore.ageFilter" size="small" round type="success" closable @close="petStore.clearAgeFilter" class="filter-tag">
            {{ ageLabelMap[petStore.ageFilter] || petStore.ageFilter }}
          </n-tag>
          <n-tag v-if="petStore.sortOption !== 'default'" size="small" round type="info" closable @close="petStore.setSortOption('default')" class="filter-tag sort-filter-tag">
            ↕️ {{ sortOptions.find(s => s.value === petStore.sortOption)?.label?.replace(/^[^\s]+\s/, '') || '排序' }}
          </n-tag>
        </div>
      </div>
    </div>

    <!-- 宠物卡片网格 -->
    <div class="section-entrance section-delay-4">
      <!-- 加载骨架屏 -->
      <div v-if="petStore.loadingList" class="pet-skeleton-grid">
        <div v-for="i in 6" :key="i" class="pet-skeleton-card">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-line skeleton-name-line"></div>
          <div class="skeleton-line skeleton-breed-line"></div>
          <div class="skeleton-tags-row">
            <div class="skeleton-tag"></div>
            <div class="skeleton-tag"></div>
          </div>
        </div>
      </div>

      <!-- 宠物卡片 -->
      <div v-else-if="petStore.petList.length" class="pet-grid">
        <div
          v-for="(pet, idx) in petStore.petList"
          :key="pet.id"
          class="pet-card item-slide-in"
          :style="{ animationDelay: `${idx * 70}ms` }"
          @click="handleShowDetail(pet.id)"
        >
          <div class="pet-card-glow"></div>
          <div class="pet-card-avatar">
            <n-avatar
              :size="72"
              :src="getAvatarUrl(pet.profileImageUrl)"
              round
              class="pet-avatar-img"
            />
            <div class="pet-card-like" @click.stop="handleLike(pet.id)">
              <span class="pet-card-like-icon">❤️</span>
              <span class="pet-card-like-count">{{ pet.likeCount }}</span>
            </div>
          </div>
          <div class="pet-card-info">
            <div class="pet-card-name">
              {{ pet.name }}
              <span v-if="pet.gender === 'male'" class="gender-icon male">♂</span>
              <span v-else-if="pet.gender === 'female'" class="gender-icon female">♀</span>
            </div>
            <div class="pet-card-breed">{{ pet.breedLabel || '未知品种' }}</div>
            <div class="pet-card-tags">
              <span v-if="pet.speciesLabel" class="pet-mini-tag species-tag">{{ pet.speciesLabel }}</span>
              <span v-if="computeAge(pet.birthday)" class="pet-mini-tag age-tag">🎂 {{ computeAge(pet.birthday) }}</span>
            </div>
            <div class="pet-card-birthday">{{ pet.birthday || '生日未知' }}</div>
          </div>
          <n-button
            v-if="authStore.isAuthenticated"
            text
            type="info"
            size="tiny"
            class="pet-card-edit-btn"
            @click.stop="handleEditPet(pet)"
          >
            <template #icon>
              <n-icon :component="CreateOutline" :size="16" />
            </template>
          </n-button>
          <!-- 快捷操作栏 -->
          <div v-if="authStore.isAuthenticated" class="pet-quick-actions">
            <button class="quick-action-btn weight-btn" @click.stop="handleQuickWeight(pet)" title="记录体重">
              <span class="qa-icon">⚖️</span>
              <span class="qa-label">体重</span>
            </button>
            <button class="quick-action-btn feeding-btn" @click.stop="handleQuickFeeding(pet)" title="记录喂养">
              <span class="qa-icon">🍽️</span>
              <span class="qa-label">喂养</span>
            </button>
            <button class="quick-action-btn health-btn" @click.stop="handleQuickHealth(pet)" title="记录健康事件">
              <span class="qa-icon">🩺</span>
              <span class="qa-label">健康</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="custom-empty">
        <div class="empty-icon-bounce">🐾</div>
        <p class="empty-text">还没有萌宠，快去添加一只吧～</p>
        <n-button @click="handleCreatePet" type="primary" class="add-pet-btn empty-cta">
          <template #icon><n-icon>+</n-icon></template>
          添加第一只萌宠
        </n-button>
        <div class="empty-stars">
          <span class="star-blink">✨</span>
          <span class="star-blink delay-1">⭐</span>
          <span class="star-blink delay-2">✨</span>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="petStore.pagination.total > 0" class="pet-grid-pagination">
        <n-pagination
          :page="petStore.currentPage"
          :page-count="petStore.totalPages"
          :item-count="petStore.pagination.total"
          @update:page="handlePageChange"
          :page-slot="isMobile ? 5 : 7"
        />
        <span class="pet-grid-total">共 {{ petStore.pagination.total }} 只萌宠</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 基础 ===== */
.pet-management {
  max-width: 1200px;
  margin: 0 auto;
}

/* ===== 沉浸式 Hero 区域 ===== */
.hero-section {
  margin-bottom: 28px;
}

.hero-border {
  border-radius: 24px;
  padding: 3px;
  background: linear-gradient(135deg, #FF9BA8 0%, #FFB4A2 30%, #FCA5A5 60%, #F9A8D4 100%);
  box-shadow: 0 8px 32px rgba(255, 155, 168, 0.2);
}

.hero-inner {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 32px 36px 28px;
  position: relative;
  overflow: hidden;
}

.hero-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.float-shape {
  position: absolute;
  font-size: 24px;
  opacity: 0.15;
  animation: float-gentle 8s ease-in-out infinite;
}

.shape-1 { top: 10%; left: 8%; animation-delay: 0s; font-size: 28px; }
.shape-2 { top: 15%; right: 12%; animation-delay: 1.5s; font-size: 22px; }
.shape-3 { bottom: 20%; left: 15%; animation-delay: 3s; }
.shape-4 { top: 50%; right: 8%; animation-delay: 2s; font-size: 26px; }
.shape-5 { bottom: 10%; right: 20%; animation-delay: 4s; font-size: 20px; }
.shape-6 { top: 30%; left: 45%; animation-delay: 1s; font-size: 18px; }

@keyframes float-gentle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-12px) rotate(5deg); }
  50% { transform: translateY(-6px) rotate(-3deg); }
  75% { transform: translateY(-15px) rotate(3deg); }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-greeting {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.hero-emoji {
  font-size: 32px;
  animation: gentle-bounce 3s ease-in-out infinite;
}

@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.hero-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.title-gradient {
  background: linear-gradient(135deg, #FF6B8A 0%, #FF9BA8 40%, #E879A8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  margin: 0 0 20px;
  font-size: 14px;
  color: #8B7B8B;
  letter-spacing: 0.3px;
}

.hero-stats-bar {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(255, 155, 168, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 14px 20px;
  border: 1px solid rgba(255, 155, 168, 0.15);
}

.hero-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.hero-stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #FF6B8A;
  line-height: 1.2;
}

.hero-stat-label {
  font-size: 11px;
  color: #9B8B9B;
  font-weight: 500;
  margin-top: 2px;
}

.hero-stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 155, 168, 0.2);
  flex-shrink: 0;
}

/* Hero 入场动画 */
.hero-section {
  animation: hero-entrance 0.8s ease-out;
}

@keyframes hero-entrance {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 区块交错入场 ===== */
.section-entrance {
  opacity: 0;
  transform: translateY(20px);
  animation: section-slide-in 0.6s ease-out forwards;
}

.section-delay-1 { animation-delay: 0.1s; }
.section-delay-2 { animation-delay: 0.2s; }
.section-delay-3 { animation-delay: 0.3s; }
.section-delay-4 { animation-delay: 0.4s; }

@keyframes section-slide-in {
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 事件提醒区域 ===== */
.event-section {
  background: var(--pet-card, #fff);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--pet-border, #F0F0F0);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.section-icon {
  font-size: 22px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2D2D2D;
  margin: 0;
}

.section-badge {
  background: linear-gradient(135deg, #FF6B8A 0%, #FF9BA8 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
  min-width: 24px;
  text-align: center;
}

/* 事件骨架屏 */
.event-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-skeleton-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #f8f8f8;
  border-radius: 14px;
}

.skeleton-badge {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-line-short { width: 40%; }
.skeleton-line-long { width: 70%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 事件列表 */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: white;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  animation: event-slide-in 0.4s ease-out both;
}

@keyframes event-slide-in {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

.event-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(255, 155, 168, 0.15);
  border-color: #FFE4E9;
}

.event-days-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  flex-shrink: 0;
}

.event-days-number {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.event-days-text {
  font-size: 10px;
  font-weight: 600;
  margin-top: 2px;
}

.days-overdue {
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  color: #DC2626;
}

.days-today {
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  color: #DC2626;
}

.days-warning {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  color: #D97706;
}

.days-normal {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #059669;
}

.event-overdue {
  border-left: 3px solid #DC2626;
}

.event-overdue:hover {
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.15);
  border-color: #DC2626;
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-info-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.event-pet-name {
  font-weight: 700;
  color: #2D2D2D;
  font-size: 15px;
}

.event-info-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.event-notes {
  color: #6B6B6B;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.event-date {
  color: #9CA3AF;
  font-size: 12px;
  flex-shrink: 0;
}

.event-arrow {
  font-size: 20px;
  color: #D1D5DB;
  font-weight: 300;
  transition: transform 0.3s ease;
}

.event-item:hover .event-arrow {
  transform: translateX(4px);
  color: #FF9BA8;
}

.event-type-icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.event-complete-btn {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.event-item:hover .event-complete-btn {
  opacity: 1;
}

/* ===== 自定义空状态 ===== */
.custom-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  border: 2px dashed rgba(255, 155, 168, 0.25);
  border-radius: 20px;
  background: rgba(255, 155, 168, 0.03);
}

.empty-icon-bounce {
  font-size: 48px;
  margin-bottom: 12px;
  animation: gentle-bounce 3s ease-in-out infinite;
}

.empty-text {
  font-size: 15px;
  color: #9B8B9B;
  margin: 0 0 12px;
}

.empty-stars {
  display: flex;
  gap: 12px;
}

.star-blink {
  font-size: 16px;
  animation: blink-star 2s ease-in-out infinite;
}

.star-blink.delay-1 { animation-delay: 0.6s; }
.star-blink.delay-2 { animation-delay: 1.2s; }

@keyframes blink-star {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.1); }
}

.empty-cta {
  margin-top: 4px;
}

/* ===== 工具栏区域 ===== */
.toolbar-section {
  background: var(--pet-card, #fff);
  border-radius: 18px;
  padding: 18px 22px;
  border: 1px solid var(--pet-border, #F0F0F0);
  margin-bottom: 20px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.pet-search-input {
  max-width: 280px;
  flex: 1;
  min-width: 180px;
}

.pet-filter-select {
  min-width: 110px;
  max-width: 140px;
}

.pet-sort-select {
  min-width: 130px;
  max-width: 160px;
}

.add-pet-btn {
  background: linear-gradient(135deg, #FF6B8A 0%, #FF9BA8 100%) !important;
  border: none !important;
  border-radius: 14px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 15px rgba(255, 155, 168, 0.3) !important;
  transition: all 0.3s ease !important;
  white-space: nowrap;
}

.add-pet-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.4) !important;
}

.active-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.filter-tag {
  transition: all 0.2s ease;
}

.sort-filter-tag {
  background: rgba(99, 102, 241, 0.08) !important;
  border-color: rgba(99, 102, 241, 0.2) !important;
}

/* ===== 宠物骨架屏 ===== */
.pet-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.pet-skeleton-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 20px;
  background: #f8f8f8;
  border-radius: 18px;
}

.skeleton-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  margin-bottom: 14px;
}

.skeleton-name-line {
  width: 60%;
  height: 14px;
  margin-bottom: 8px;
}

.skeleton-breed-line {
  width: 40%;
  height: 12px;
  margin-bottom: 12px;
}

.skeleton-tags-row {
  display: flex;
  gap: 6px;
}

.skeleton-tag {
  width: 50px;
  height: 22px;
  border-radius: 12px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* ===== 卡片网格 ===== */
.pet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.pet-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 16px;
  background: #fff;
  border-radius: 18px;
  border: 1px solid var(--pet-border, #F0F0F0);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.pet-card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 155, 168, 0.08) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.pet-card:hover .pet-card-glow {
  opacity: 1;
}

.pet-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(255, 155, 168, 0.18);
  border-color: var(--pet-primary, #FF9BA8);
}

/* 卡片入场动画 */
.item-slide-in {
  opacity: 0;
  transform: translateY(16px);
  animation: card-slide-in 0.5s ease-out forwards;
}

@keyframes card-slide-in {
  to { opacity: 1; transform: translateY(0); }
}

/* 头像区域 */
.pet-card-avatar {
  position: relative;
  margin-bottom: 12px;
}

.pet-avatar-img {
  border: 3px solid #FFE4E9 !important;
  box-shadow: 0 4px 14px rgba(255, 155, 168, 0.2);
  transition: transform 0.3s ease;
}

.pet-card:hover .pet-avatar-img {
  transform: scale(1.05);
}

.pet-card-like {
  position: absolute;
  bottom: -4px;
  right: -8px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
  font-size: 12px;
}

.pet-card-like:hover {
  transform: scale(1.15);
}

.pet-card-like-icon {
  font-size: 14px;
  line-height: 1;
}

.pet-card-like-count {
  font-weight: 700;
  color: #EF4444;
  font-size: 13px;
}

/* 信息区域 */
.pet-card-info {
  text-align: center;
  width: 100%;
}

.pet-card-name {
  font-size: 17px;
  font-weight: 700;
  color: #2D2D2D;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.gender-icon {
  font-size: 15px;
  font-weight: 700;
}

.gender-icon.male { color: #7DD3FC; }
.gender-icon.female { color: #FCA5A5; }

.pet-card-breed {
  font-size: 13px;
  color: #9CA3AF;
  margin-bottom: 10px;
}

.pet-card-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.pet-mini-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.species-tag {
  background: rgba(99, 102, 241, 0.1);
  color: #6366F1;
}

.age-tag {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.pet-card-birthday {
  font-size: 12px;
  color: #B0B0B0;
}

/* 编辑按钮 */
.pet-card-edit-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.pet-card:hover .pet-card-edit-btn {
  opacity: 0.7;
}

.pet-card-edit-btn:hover {
  opacity: 1 !important;
}

/* 快捷操作栏 */
.pet-quick-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--pet-border, rgba(240, 230, 224, 0.6));
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}

.pet-card:hover .pet-quick-actions {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 155, 168, 0.08);
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 11px;
  color: var(--pet-text2, #6B6B6B);
  font-weight: 600;
  font-family: inherit;
  white-space: nowrap;
}

.quick-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.quick-action-btn.weight-btn:hover {
  background: rgba(125, 211, 252, 0.2);
  color: #0EA5E9;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}

.quick-action-btn.feeding-btn:hover {
  background: rgba(252, 211, 77, 0.2);
  color: #D97706;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15);
}

.quick-action-btn.health-btn:hover {
  background: rgba(134, 239, 172, 0.2);
  color: #059669;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);
}

.qa-icon {
  font-size: 13px;
  line-height: 1;
}

.qa-label {
  font-size: 11px;
  line-height: 1;
}

/* 分页 */
.pet-grid-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding-top: 8px;
  flex-wrap: wrap;
}

.pet-grid-total {
  font-size: 13px;
  color: #9CA3AF;
}

/* ===== 暗色主题 ===== */
:global(.dark-mode) .hero-border {
  background: linear-gradient(135deg, #8B3A5E 0%, #6B3A7A 50%, #4A3A8A 100%);
  box-shadow: 0 8px 32px rgba(139, 58, 94, 0.3);
}

:global(.dark-mode) .hero-inner {
  background: rgba(20, 16, 36, 0.92);
}

:global(.dark-mode) .hero-subtitle {
  color: #9B8BB0;
}

:global(.dark-mode) .hero-stats-bar {
  background: rgba(139, 58, 94, 0.12);
  border-color: rgba(139, 58, 94, 0.25);
}

:global(.dark-mode) .hero-stat-value {
  color: #F9A8D4;
}

:global(.dark-mode) .hero-stat-label {
  color: #8B7B9B;
}

:global(.dark-mode) .hero-stat-divider {
  background: rgba(139, 58, 94, 0.3);
}

:global(.dark-mode) .event-section {
  background: var(--pet-bg-secondary, #1F1F3A);
  border-color: var(--pet-border, #3D3D5C);
}

:global(.dark-mode) .section-title {
  color: #E8E8E8;
}

:global(.dark-mode) .section-badge {
  background: linear-gradient(135deg, #8B3A5E 0%, #A855A0 100%);
}

:global(.dark-mode) .event-skeleton-item {
  background: #2A2A4A;
}

:global(.dark-mode) .skeleton-badge,
:global(.dark-mode) .skeleton-line,
:global(.dark-mode) .skeleton-avatar,
:global(.dark-mode) .skeleton-tag {
  background: linear-gradient(90deg, #2A2A4A 25%, #3A3A5A 50%, #2A2A4A 75%);
  background-size: 200% 100%;
}

:global(.dark-mode) .event-item {
  background: var(--pet-bg-secondary, #1F1F3A);
}

:global(.dark-mode) .event-item:hover {
  border-color: #3D3D5C;
}

:global(.dark-mode) .event-pet-name {
  color: #E8E8E8;
}

:global(.dark-mode) .event-notes {
  color: #B8B8CC;
}

:global(.dark-mode) .event-date {
  color: #8888A0;
}

:global(.dark-mode) .event-arrow {
  color: #555;
}

:global(.dark-mode) .event-overdue {
  border-left-color: #EF4444;
}

:global(.dark-mode) .event-overdue:hover {
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
  border-color: #EF4444;
}

:global(.dark-mode) .event-complete-btn {
  color: #86EFAC !important;
}

:global(.dark-mode) .custom-empty {
  border-color: rgba(139, 58, 94, 0.25);
  background: rgba(139, 58, 94, 0.05);
}

:global(.dark-mode) .empty-text {
  color: #8B7B9B;
}

:global(.dark-mode) .toolbar-section {
  background: var(--pet-bg-secondary, #1F1F3A);
  border-color: var(--pet-border, #3D3D5C);
}

:global(.dark-mode) .pet-skeleton-card {
  background: #2A2A4A;
}

:global(.dark-mode) .pet-card {
  background: var(--pet-bg-secondary, #1F1F3A);
  border-color: var(--pet-border, #3D3D5C);
}

:global(.dark-mode) .pet-card:hover {
  box-shadow: 0 8px 30px rgba(139, 58, 94, 0.15);
  border-color: #A855A0;
}

:global(.dark-mode) .pet-card-name {
  color: #E8E8E8;
}

:global(.dark-mode) .pet-card-like {
  background: var(--pet-bg-secondary, #2A2A4A);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:global(.dark-mode) .pet-card-breed {
  color: #8888A0;
}

:global(.dark-mode) .pet-card-birthday {
  color: #7777A0;
}

:global(.dark-mode) .pet-quick-actions {
  border-top-color: rgba(61, 61, 92, 0.6);
}

:global(.dark-mode) .quick-action-btn {
  background: rgba(139, 58, 94, 0.12);
  color: #B0B0C8;
}

:global(.dark-mode) .quick-action-btn.weight-btn:hover {
  background: rgba(14, 165, 233, 0.18);
  color: #38BDF8;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
}

:global(.dark-mode) .quick-action-btn.feeding-btn:hover {
  background: rgba(217, 119, 6, 0.18);
  color: #FBBF24;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);
}

:global(.dark-mode) .quick-action-btn.health-btn:hover {
  background: rgba(5, 150, 105, 0.18);
  color: #34D399;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
}

:global(.dark-mode) .species-tag {
  background: rgba(99, 102, 241, 0.15);
  color: #A5B4FC;
}

:global(.dark-mode) .age-tag {
  background: rgba(16, 185, 129, 0.15);
  color: #6EE7B7;
}

:global(.dark-mode) .sort-filter-tag {
  background: rgba(165, 180, 252, 0.1) !important;
  border-color: rgba(165, 180, 252, 0.25) !important;
  color: #A5B4FC !important;
}

:global(.dark-mode) .pet-grid-total {
  color: #7777A0;
}

:global(.dark-mode) .add-pet-btn {
  background: linear-gradient(135deg, #8B3A5E 0%, #A855A0 100%) !important;
  box-shadow: 0 4px 15px rgba(139, 58, 94, 0.3) !important;
}

:global(.dark-mode) .add-pet-btn:hover {
  box-shadow: 0 6px 20px rgba(139, 58, 94, 0.45) !important;
}

/* ===== 响应式 ===== */
@media (max-width: 1200px) {
  .hero-inner {
    padding: 28px 28px 24px;
  }
}

@media (max-width: 768px) {
  .hero-inner {
    padding: 22px 20px 20px;
  }

  .hero-title {
    font-size: 22px;
  }

  .hero-emoji {
    font-size: 26px;
  }

  .hero-subtitle {
    font-size: 13px;
    margin-bottom: 16px;
  }

  .hero-stats-bar {
    padding: 12px 14px;
    border-radius: 14px;
  }

  .hero-stat-value {
    font-size: 20px;
  }

  .hero-stat-label {
    font-size: 10px;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }

  .pet-search-input {
    max-width: 100%;
    min-width: 0;
  }

  .pet-filter-select {
    max-width: 100%;
  }

  .pet-sort-select {
    max-width: 100%;
  }

  .add-pet-btn {
    width: 100%;
  }

  .add-pet-btn :deep(span) {
    display: inline;
  }

  .pet-grid,
  .pet-skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .pet-card {
    padding: 16px 10px 12px;
  }

  .pet-card-avatar .n-avatar {
    --n-size: 56px !important;
  }

  /* 移动端快捷操作栏始终可见 */
  .pet-quick-actions {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
    gap: 4px;
    margin-top: 8px;
    padding-top: 8px;
  }

  .quick-action-btn {
    padding: 4px 6px;
    font-size: 10px;
  }

  .qa-icon {
    font-size: 12px;
  }

  .qa-label {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .hero-border {
    border-radius: 18px;
  }

  .hero-inner {
    border-radius: 16px;
    padding: 18px 16px 16px;
  }

  .hero-title {
    font-size: 20px;
  }

  .hero-greeting {
    gap: 8px;
  }

  .hero-emoji {
    font-size: 22px;
  }

  .hero-stats-bar {
    padding: 10px 8px;
    border-radius: 12px;
    gap: 0;
  }

  .hero-stat-value {
    font-size: 18px;
  }

  .hero-stat-label {
    font-size: 9px;
  }

  .section-title {
    font-size: 16px;
  }

  .event-section {
    padding: 16px;
    border-radius: 16px;
  }

  .toolbar-section {
    padding: 14px 16px;
    border-radius: 14px;
  }

  .pet-grid,
  .pet-skeleton-grid {
    gap: 10px;
  }

  .pet-card {
    padding: 14px 8px 10px;
    border-radius: 14px;
  }
}
</style>
