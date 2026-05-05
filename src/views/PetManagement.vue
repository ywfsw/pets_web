<script setup>
import { h, computed, ref, onMounted, onUnmounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import { useMessage } from 'naive-ui';
import PetLeaderboard from '@/components/PetLeaderboard.vue';

import {
  NCard,
  NDataTable,
  NButton,
  NAvatar,
  NThing,
  NSpace,
  NH5,
  NText,
  NEmpty,
  NSpin,
  NTag,
  NPopconfirm,
  NIcon,
  NInput,
  NSelect
} from 'naive-ui';
import { PawOutline, CalendarOutline, CreateOutline, CheckmarkCircleOutline, SearchOutline } from '@vicons/ionicons5';

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

// 物种选项（从字典中获取）
const speciesFilterOptions = computed(() => {
  return dictStore.species.map(s => ({ label: s.itemLabel, value: s.id }));
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

// 获取物种标签类型
const getSpeciesTagType = (species) => {
  const typeMap = {
    'dog': 'warning',
    'cat': 'success',
    'bird': 'info',
    'fish': 'info',
    'rabbit': 'warning',
    'hamster': 'warning'
  };
  return typeMap[species?.toLowerCase()] || 'default';
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

const createColumns = ({ handleShowDetail, handleEditPet, isMobile }) => {
  const baseColumns = [
    {
      title: '萌宠',
      key: 'name',
      render(row) {
        const genderIcon = row.gender === 'male' ? '♂' : row.gender === 'female' ? '♀' : '';
        const genderColor = row.gender === 'male' ? '#7DD3FC' : row.gender === 'female' ? '#FCA5A5' : '';
        return h(
          NThing,
          {
            title: () => h('span', null, [
              h('span', null, row.name),
              genderIcon ? h('span', {
                style: `margin-left: 4px; font-size: 14px; color: ${genderColor}; font-weight: 700;`
              }, genderIcon) : null
            ]),
            description: row.breedLabel || '未知品种',
            style: 'cursor: pointer;',
            onClick: () => handleShowDetail(row.id)
          },
          {
            avatar: () => h(NAvatar, {
              size: 'large',
              src: getAvatarUrl(row.profileImageUrl),
              round: true,
              style: {
                border: '3px solid #FFE4E9',
                boxShadow: '0 2px 10px rgba(255, 155, 168, 0.2)'
              }
            }),
          }
        );
      }
    },
    {
      title: '生日',
      key: 'birthday',
      width: 180,
      render(row) {
        const age = computeAge(row.birthday);
        return h(NSpace, { align: 'center', size: 4 }, () => [
          h('span', null, row.birthday || '未知'),
          age ? h(NTag, { type: 'success', size: 'small', round: true }, () => `🎂 ${age}`) : null
        ]);
      }
    },
    {
      title: '物种',
      key: 'speciesLabel',
      width: 100,
      render(row) {
        return h(NTag, {
          type: getSpeciesTagType(row.species),
          size: 'small',
          round: true
        }, () => row.speciesLabel || '未知');
      }
    },
    {
      title: '点赞',
      key: 'likeCount',
      width: 110,
      render(row) {
        return h(
          'div',
          {
            class: 'like-button-wrapper',
            onClick: async () => {
              try {
                await petStore.handleLike(row.id);
              } catch (error) {
                console.error('Failed to like pet:', error);
              }
            }
          },
          [
            h('span', { class: 'like-icon' }, '❤️'),
            h('span', { class: 'like-count' }, row.likeCount)
          ]
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render(row) {
        return h(
          NPopconfirm,
          {
            onPositiveClick: () => handleEditPet(row),
            positiveButtonProps: { type: 'info', size: 'small' },
            negativeButtonProps: { size: 'small' }
          },
          {
            trigger: () => h(
              NButton,
              {
                text: true,
                type: 'info',
                size: 'tiny',
                disabled: !authStore.isAuthenticated,
                style: { padding: '4px 8px' }
              },
              {
                icon: () => h(NIcon, { component: CreateOutline, size: 16 })
              }
            ),
            default: () => `编辑 ${row.name} 的信息？`
          }
        );
      }
    }
  ];

  if (isMobile) {
    return baseColumns.filter(col => ['name', 'likeCount'].includes(col.key));
  }
  return baseColumns;
};

const responsiveColumns = computed(() => createColumns({
  handleLike: petStore.handleLike,
  handleShowDetail: handleShowDetail,
  handleEditPet: handleEditPet,
  isMobile: isMobile.value
}));

const pagination = computed(() => ({
  page: petStore.currentPage,
  pageCount: petStore.totalPages,
  itemCount: petStore.pagination.total,
  onUpdatePage: handlePageChange,
  prefix: ({ itemCount }) => `共 ${itemCount} 只萌宠`
}));

</script>

<template>
  <n-space vertical :size="24" class="pet-management">
    <!-- 排行榜 -->
    <PetLeaderboard />

    <!-- 事件提醒卡片 -->
    <n-card class="event-card" :bordered="false">
      <template #header>
        <n-space align="center">
          <n-icon :component="CalendarOutline" size="20" color="#FF9BA8" />
          <span class="event-title">📅 事件提醒</span>
        </n-space>
      </template>
      <n-spin :show="petStore.loadingUpcoming">
        <div v-if="petStore.upcomingEvents.length" class="event-list">
          <div
            v-for="event in petStore.upcomingEvents"
            :key="event.id"
            class="event-item"
            :class="{ 'event-overdue': event.isOverdue }"
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
        <n-empty v-else-if="!petStore.loadingUpcoming" description="太棒了！没有需要提醒的事件～" size="small">
          <template #icon>
            <span style="font-size: 40px;">🎉</span>
          </template>
        </n-empty>
      </n-spin>
    </n-card>

    <!-- 宠物列表卡片 -->
    <n-card class="pet-list-card">
      <template #header>
        <n-space align="center" justify="space-between">
          <n-space align="center">
            <n-icon :component="PawOutline" size="22" color="#FF9BA8" />
            <span class="pet-list-title">🐾 萌宠列表</span>
          </n-space>
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
        </n-space>
      </template>

      <!-- 搜索和筛选栏 -->
      <div class="pet-search-bar">
        <n-input
          :value="petStore.searchKeyword"
          @update:value="handleSearchInput"
          placeholder="搜索宠物名称..."
          clearable
          size="small"
          @clear="handleClearSearch"
          class="pet-search-input"
        >
          <template #prefix>
            <n-icon :component="SearchOutline" size="16" color="#9CA3AF" />
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
        <n-tag v-if="petStore.searchKeyword" size="small" round closable @close="handleClearSearch" class="search-tag">
          搜索: {{ petStore.searchKeyword }}
        </n-tag>
        <n-tag v-if="petStore.speciesFilter" size="small" round type="info" closable @close="petStore.clearSpeciesFilter" class="search-tag">
          物种: {{ dictStore.species.find(s => s.id === petStore.speciesFilter)?.itemLabel }}
        </n-tag>
        <n-tag v-if="petStore.genderFilter" size="small" round type="warning" closable @close="petStore.clearGenderFilter" class="search-tag">
          {{ petStore.genderFilter === 'male' ? '♂ 公' : '♀ 母' }}
        </n-tag>
      </div>

      <n-spin :show="petStore.loadingList">
        <n-data-table
          :columns="responsiveColumns"
          :data="petStore.petList"
          :pagination="pagination"
          :remote="true"
          :row-key="row => row.id"
          :bordered="false"
          class="pet-table"
        />
      </n-spin>
    </n-card>
  </n-space>
</template>

<style scoped>
.pet-management {
  max-width: 1200px;
  margin: 0 auto;
}

/* 事件卡片 */
.event-card {
  background: var(--pet-card);
  border-radius: 20px;
  border: 1px solid var(--pet-border);
}

.event-title {
  font-weight: 600;
  color: #4A4A4A;
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

:global(.dark-mode) .event-title {
  color: #E8E8E8;
}

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

:global(.dark-mode) .event-complete-btn {
  color: #86EFAC !important;
}

/* 宠物列表卡片 */
.pet-list-card {
  border-radius: 20px;
}

.pet-list-title {
  font-size: 18px;
  font-weight: 700;
  color: #2D2D2D;
}

.add-pet-btn {
  background: linear-gradient(135deg, var(--pet-primary) 0%, var(--pet-primarySuppl) 100%) !important;
  border: none !important;
  border-radius: 20px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 15px rgba(255, 155, 168, 0.3) !important;
  transition: all 0.3s ease !important;
}

.add-pet-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 155, 168, 0.4);
}

/* 搜索栏 */
.pet-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pet-search-input {
  max-width: 280px;
}

.pet-filter-select {
  min-width: 110px;
  max-width: 140px;
}

.search-tag {
  flex-shrink: 0;
}

/* 表格样式 */
.pet-table :deep(.n-data-table-th) {
  background: var(--pet-bg-secondary) !important;
  font-weight: 600;
}

.pet-table :deep(.n-data-table-tr:hover) {
  background: var(--pet-bg) !important;
}

/* 响应式 */
@media (max-width: 768px) {
  .pet-list-title {
    font-size: 16px;
  }

  .add-pet-btn span {
    display: none;
  }
}
</style>
