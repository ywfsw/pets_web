<script setup>
import { usePetStore } from '@/stores/petStore.js';
import { useCloudinaryImage } from '@/composables/useCloudinaryImage.js';
import {
  NModal,
  NCard,
  NSpace,
  NAvatar,
  NList,
  NListItem,
  NThing,
  NH4,
  NText,
  NSkeleton,
  NButton,
} from 'naive-ui';

import HealthEventFormModal from './HealthEventFormModal.vue';
import WeightLogFormModal from './WeightLogFormModal.vue';

const petStore = usePetStore();
const { getAvatarUrl } = useCloudinaryImage();

const handleShowWeightForm = () => {
  if (petStore.detailModal.data?.id) {
    petStore.showWeightLogFormModal(petStore.detailModal.data.id);
  }
};
const handleShowHealthEventForm = () => {
  if (petStore.detailModal.data?.id) {
    petStore.showHealthEventFormModal(petStore.detailModal.data.id);
  }
};

const handleClose = () => {
  petStore.closeAllPetModals();
};
</script>

<template>
  <n-modal
    :show="petStore.detailModal.show"
    @update:show="handleClose"
    preset="card"
    style="width: 600px;"
    :title="petStore.detailModal.data?.name || '宠物详情'"
    :bordered="false"
  >
    <template v-if="petStore.detailModal.loading">
      <n-space vertical>
        <n-skeleton height="120px" width="120px" :sharp="false" style="border-radius: 50%; margin: 0 auto;" />
        <n-skeleton text :repeat="6" />
      </n-space>
    </template>

    <template v-else-if="petStore.detailModal.data">
      <n-space vertical :size="24">
        <div style="text-align: center;">
          <n-avatar
            round
            :size="120"
            :src="getAvatarUrl(petStore.detailModal.data.avatarUrl)"
          />
        </div>

        <n-list bordered>
          <n-list-item>
            <n-thing title="物种" :description="petStore.detailModal.data.speciesLabel" />
          </n-list-item>
          <n-list-item>
            <n-thing title="品种" :description="petStore.detailModal.data.breedLabel" />
          </n-list-item>
        </n-list>

        <div>
          <n-h4>近期体重</n-h4>
          <n-list v-if="petStore.detailModal.data.weightLogs?.length">
            <n-list-item v-for="log in petStore.detailModal.data.weightLogs" :key="log.id">
              {{ log.logDate }}: {{ log.weightKg }} kg
            </n-list-item>
          </n-list>
          <n-text v-else depth="3"><i>暂无体重记录</i></n-text>
        </div>

        <div>
          <n-h4>健康事件</n-h4>
          <n-list v-if="petStore.detailModal.data.healthEvents?.length">
            <n-list-item v-for="event in petStore.detailModal.data.healthEvents" :key="event.id">
              {{ event.eventDate }}:
              <strong>{{ event.eventTypeLabel || '未知事件' }}</strong>
              <n-text depth="3" v-if="event.notes"> ({{ event.notes }})</n-text>
              <n-text depth="3" v-if="event.nextDueDate"> (下次: {{ event.nextDueDate }})</n-text>
            </n-list-item>
          </n-list>
          <n-text v-else depth="3"><i>暂无健康事件</i></n-text>
        </div>
      </n-space>
    </template>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleShowWeightForm">体重变化</n-button>
        <n-button @click="handleShowHealthEventForm">添加事件</n-button>
        <n-button type="primary" @click="petStore.switchToEditMode()">编辑</n-button>
      </n-space>
    </template>
  </n-modal>
  <HealthEventFormModal />
  <WeightLogFormModal />
</template>
