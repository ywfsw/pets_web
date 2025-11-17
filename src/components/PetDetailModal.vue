<script setup>
import { usePetStore } from '@/stores/petStore.js';

const petStore = usePetStore();

// (TODO: Handlers for Add Weight / Add Event)
const handleShowWeightForm = () => {};
const handleShowHealthEventForm = () => {};
</script>

<template>
  <dialog :open="petStore.detailModal.show" @click.self="petStore.closeAllPetModals()">
    <article :aria-busy="petStore.detailModal.loading">
      <header>
        <a href="#" aria-label="Close" class="close" @click.prevent="petStore.closeAllPetModals()"></a>
        <strong>{{ petStore.detailModal.data ? petStore.detailModal.data.name : '加载中...' }}</strong>
      </header>

      <div v-if="petStore.detailModal.data" class="avatar-wrapper">
        <img v-if="petStore.detailModal.data.avatarUrl" :src="petStore.detailModal.data.avatarUrl" alt="Pet Avatar" class="pet-detail-avatar">
        <div v-else class="pet-detail-avatar-placeholder">
          <span>无头像</span>
        </div>
      </div>

      <div v-if="petStore.detailModal.data">
        <ul>
          <li><strong>物种:</strong> {{ petStore.detailModal.data.speciesLabel }}</li>
          <li><strong>品种:</strong> {{ petStore.detailModal.data.breedLabel }}</li>
        </ul>
        <hr>
        <h4>近期体重</h4>
        <ul v-if="petStore.detailModal.data.weightLogs && petStore.detailModal.data.weightLogs.length">
          <li v-for="log in petStore.detailModal.data.weightLogs" :key="log.id">
            {{ log.logDate }}: {{ log.weightKg }} kg
          </li>
        </ul>
        <p v-else><i>暂无体重记录</i></p>
        <hr>
        <h4>健康事件</h4>
        <ul v-if="petStore.detailModal.data.healthEvents && petStore.detailModal.data.healthEvents.length">
          <li v-for="event in petStore.detailModal.data.healthEvents" :key="event.id">
            {{ event.eventDate }}:
            <strong>{{ event.eventTypeLabel || '未知事件' }}</strong>
            <small v-if="event.notes"> ({{ event.notes }})</small>
            <small v-if="event.nextDueDate"> (下次: {{ event.nextDueDate }})</small>
          </li>
        </ul>
        <p v-else><i>暂无健康事件</i></p>
      </div>

      <footer class="grid">

        <button class="outline" @click="handleShowWeightForm">体重变化</button>

        <button class="outline" @click="handleShowHealthEventForm">添加事件</button>

        <button class="secondary" @click="petStore.switchToEditMode()">
          编辑
        </button>
      </footer>

    </article>
  </dialog>
</template>

<style scoped>
small {
  margin-left: 0.25rem;
  color: #738290;
}

.avatar-wrapper {
  text-align: center;
  margin-bottom: 1rem;
}

.pet-detail-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.pet-detail-avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--pico-muted-color);
  display: inline-grid;
  place-items: center;
  color: white;
  font-weight: bold;
}
</style>
