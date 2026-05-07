<script setup>
import { computed } from 'vue';

const props = defineProps({
  pets: { type: Array, required: true },
  selectedId: { type: [Number, String, null], default: null },
  showAll: { type: Boolean, default: false },
  allLabel: { type: String, default: '全部宠物' },
});

const emit = defineEmits(['select']);

const hasPets = computed(() => props.pets.length > 0);

function handleSelect(id) {
  emit('select', id);
}
</script>

<template>
  <div v-if="hasPets" class="pet-avatar-selector">
    <div class="avatar-scroll">
      <button
        v-if="showAll"
        class="avatar-card"
        :class="{ active: selectedId === null }"
        @click="handleSelect(null)"
      >
        <div class="avatar-ring all-ring">
          <span class="avatar-emoji">🐾</span>
        </div>
        <span class="avatar-name">{{ allLabel }}</span>
      </button>
      <button
        v-for="(pet, idx) in pets"
        :key="pet.id"
        class="avatar-card"
        :class="{ active: selectedId === pet.id }"
        :style="{ '--card-delay': (idx * 0.05) + 's' }"
        @click="handleSelect(pet.id)"
      >
        <div class="avatar-ring" :class="{ 'has-img': pet.avatarUrl || pet.profileImageUrl }">
          <img v-if="pet.avatarUrl || pet.profileImageUrl" :src="pet.avatarUrl || pet.profileImageUrl" :alt="pet.name" class="avatar-img" />
          <span v-else class="avatar-emoji">{{ pet.gender === 'female' ? '♀' : '♂' }}</span>
        </div>
        <span class="avatar-name">{{ pet.name }}</span>
        <span v-if="pet.speciesName || pet.speciesLabel" class="avatar-species">{{ pet.speciesName || pet.speciesLabel }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.pet-avatar-selector {
  width: 100%;
}

.avatar-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 2px 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(16, 185, 129, 0.3) transparent;
}

.avatar-scroll::-webkit-scrollbar {
  height: 4px;
}

.avatar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.avatar-scroll::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.3);
  border-radius: 2px;
}

.avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 14px 8px;
  border: 1.5px solid rgba(16, 185, 129, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  min-width: 88px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  animation: cardSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: var(--card-delay, 0s);
}

.avatar-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(6, 182, 212, 0.04));
  opacity: 0;
  transition: opacity 0.28s;
  border-radius: 14px;
  pointer-events: none;
}

.avatar-card:hover {
  transform: translateY(-4px) scale(1.04);
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
}

.avatar-card:hover::before {
  opacity: 1;
}

.avatar-card.active {
  border-color: rgba(16, 185, 129, 0.6);
  background: rgba(16, 185, 129, 0.1);
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2), inset 0 0 0 1px rgba(16, 185, 129, 0.15);
  transform: translateY(-2px);
}

.avatar-card.active::before {
  opacity: 1;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.06));
}

.avatar-ring {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08));
  border: 2.5px solid rgba(16, 185, 129, 0.2);
  transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
  position: relative;
}

.all-ring {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(52, 211, 153, 0.12));
}

.avatar-card.active .avatar-ring {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.25);
}

.avatar-card:hover .avatar-ring {
  transform: scale(1.08);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-emoji {
  font-size: 20px;
  line-height: 1;
}

.avatar-card.active .avatar-emoji {
  animation: gentleBounce 0.6s ease;
}

.avatar-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.28s;
}

.avatar-card.active .avatar-name {
  color: #059669;
}

.avatar-species {
  font-size: 10px;
  color: #9ca3af;
  background: rgba(16, 185, 129, 0.08);
  padding: 1px 8px;
  border-radius: 8px;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar-card.active .avatar-species {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

/* Dark theme */
:global(.dark-mode) .avatar-card {
  background: rgba(30, 30, 50, 0.6);
  border-color: rgba(16, 185, 129, 0.15);
}

:global(.dark-mode) .avatar-card:hover {
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.12);
}

:global(.dark-mode) .avatar-card.active {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15), inset 0 0 0 1px rgba(16, 185, 129, 0.12);
}

:global(.dark-mode) .avatar-ring {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1));
  border-color: rgba(16, 185, 129, 0.25);
}

:global(.dark-mode) .avatar-card.active .avatar-ring {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15), 0 4px 12px rgba(16, 185, 129, 0.2);
}

:global(.dark-mode) .avatar-name {
  color: #e5e7eb;
}

:global(.dark-mode) .avatar-card.active .avatar-name {
  color: #34d399;
}

:global(.dark-mode) .avatar-species {
  background: rgba(16, 185, 129, 0.1);
  color: #9ca3af;
}

:global(.dark-mode) .avatar-card.active .avatar-species {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
}

:global(.dark-mode) .avatar-scroll {
  scrollbar-color: rgba(16, 185, 129, 0.2) transparent;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes gentleBounce {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
  60% { transform: translateY(-2px); }
}

/* Mobile */
@media (max-width: 768px) {
  .avatar-scroll {
    gap: 8px;
  }
  .avatar-card {
    min-width: 72px;
    padding: 8px 10px 6px;
    border-radius: 14px;
  }
  .avatar-ring {
    width: 40px;
    height: 40px;
  }
  .avatar-emoji {
    font-size: 17px;
  }
  .avatar-name {
    font-size: 11px;
    max-width: 64px;
  }
  .avatar-species {
    font-size: 9px;
    max-width: 60px;
  }
}

@media (max-width: 480px) {
  .avatar-card {
    min-width: 64px;
    padding: 6px 8px 5px;
  }
  .avatar-ring {
    width: 36px;
    height: 36px;
  }
  .avatar-emoji {
    font-size: 15px;
  }
  .avatar-name {
    font-size: 10px;
  }
}
</style>
