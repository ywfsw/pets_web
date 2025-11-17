<script setup>
import { h, computed } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import PetLeaderboard from '@/components/PetLeaderboard.vue';

import {
  NCard,
  NDataTable,
  NButton,
  NPagination,
  NAvatar,
  NThing,
  NSpace,
  NH5,
  NText,
  NIcon,
} from 'naive-ui';
import { Heart as HeartIcon } from '@vicons/ionicons5';

const petStore = usePetStore();
const { getAvatarUrl } = useCloudinaryImage();

// Handlers
const handleCreatePet = () => { petStore.showPetFormModal(null); };
const handleShowDetail = (petId) => { petStore.showDetailModal(petId); };
const handlePageChange = (page) => { petStore.loadPetList(page); };

const createColumns = ({ handleLike, handleShowDetail }) => {
  return [
    {
      title: '名字',
      key: 'name',
      render(row) {
        return h(
          NThing,
          {
            title: row.name,
            description: row.breedLabel || '未知',
            style: 'cursor: pointer;',
            onClick: () => handleShowDetail(row.id)
          },
          {
            avatar: () => h(NAvatar, {
              size: 'medium',
              src: getAvatarUrl(row.profileImageUrl),
              circle: true,
            }),
            // 'header-extra': () => h(NText, { depth: 3, style: 'font-size: 12px;' }, () => `#${row.id}`)
          }
        );
      }
    },
    {
      title: '生日',
      key: 'birthday',
      width: 120,
    },
    {
      title: '物种',
      key: 'speciesLabel',
      width: 120,
    },
    {
      title: '点赞',
      key: 'likeCount',
      width: 120,
      render(row) {
        return h(
          NButton,
          {
            strong: true,
            tertiary: true,
            circle: true,
            loading: petStore.likingPetIds.has(row.id),
            onClick: () => handleLike(row.id)
          },
          {
            icon: () => h(NIcon, null, () => h(HeartIcon)),
            default: () => row.likeCount
          }
        );
      }
    }
  ];
};

const columns = createColumns({
  handleLike: petStore.handleLike,
  handleShowDetail: handleShowDetail
});

const pagination = computed(() => ({
  page: petStore.currentPage,
  pageCount: petStore.totalPages,
  itemCount: petStore.pagination.total,
  onUpdatePage: handlePageChange,
  prefix: ({ itemCount }) => `总计 ${itemCount} 条`
}));

</script>

<template>
  <n-space vertical :size="24">
    <PetLeaderboard />

    <n-card>
      <n-h5>🔔 即将到期的事件 (7天内)</n-h5>
      <div v-if="petStore.upcomingEvents.length">
        <n-text v-for="event in petStore.upcomingEvents" :key="event.id" tag="p" style="margin: 4px 0;">
          <strong>{{ event.nextDueDate }}</strong> - {{ event.petName }} 需要: {{ event.notes || '执行事件' }}
        </n-text>
      </div>
      <n-text v-else depth="3"><i>太好了, 7天内没有需要提醒的事件。</i></n-text>
    </n-card>

    <n-card>
      <template #header>
        宠物列表
      </template>
      <template #header-extra>
        <n-button @click="handleCreatePet" type="primary">添加新宠物</n-button>
      </template>

      <n-data-table
        :columns="columns"
        :data="petStore.petList"
        :loading="petStore.loadingList"
        :pagination="pagination"
        :remote="true"
        :row-key="row => row.id"
      />
    </n-card>
  </n-space>
</template>
