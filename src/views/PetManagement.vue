<script setup>
import { h, computed, ref, onMounted, onUnmounted } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useAuthStore } from '@/stores/authStore.js';
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
  NBadge,
  NPopconfirm
} from 'naive-ui';
import { PawOutline, CalendarOutline, CreateOutline } from '@vicons/ionicons5';

const petStore = usePetStore();
const authStore = useAuthStore();
const message = useMessage();
const { getAvatarUrl } = useCloudinaryImage();

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

const createColumns = ({ handleShowDetail, handleEditPet, isMobile }) => {
  const baseColumns = [
    {
      title: '萌宠',
      key: 'name',
      render(row) {
        return h(
          NThing,
          {
            title: row.name,
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
          <span class="event-title">📅 即将到期的事件</span>
        </n-space>
      </template>
      <div v-if="petStore.upcomingEvents.length" class="event-list">
        <div
          v-for="event in petStore.upcomingEvents"
          :key="event.id"
          class="event-item"
        >
          <n-badge :value="event.nextDueDate" :type="event.daysLeft <= 1 ? 'error' : 'warning'" />
          <span class="event-pet-name">{{ event.petName }}</span>
          <span class="event-notes">{{ event.notes || '执行事件' }}</span>
        </div>
      </div>
      <n-empty v-else description="太棒了！7天内没有需要提醒的事件～" size="small">
        <template #icon>
          <span style="font-size: 40px;">🎉</span>
        </template>
      </n-empty>
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

.event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.event-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 10px rgba(255, 155, 168, 0.1);
}

.event-pet-name {
  font-weight: 600;
  color: #FF9BA8;
}

.event-notes {
  color: #6B6B6B;
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
