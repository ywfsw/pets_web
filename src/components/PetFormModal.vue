<script setup>
import { computed } from 'vue';
import { usePetStore } from '@/stores/petStore.js';
import { useDictionaryStore } from '@/stores/dictionaryStore.js';

const petStore = usePetStore();
const dictStore = useDictionaryStore();

const filteredBreeds = computed(() => {
  if (!petStore.petFormModal.data) return [];
  const speciesId = petStore.petFormModal.data.speciesId;
  if (!speciesId) return [];
  return dictStore.breeds.filter(b => b.parentId === speciesId);
});

const handleSubmit = () => {
  petStore.handleSavePet();
};
</script>

<template>
  <dialog :open="petStore.petFormModal.show" @click.self="petStore.closeAllPetModals()">

    <article
      v-if="petStore.petFormModal.data"
      :aria-busy="petStore.petFormModal.loading"
    >
      <header>
        <a href="#" aria-label="Close" class="close" @click.prevent="petStore.closeAllPetModals()"></a>
        <strong>{{ petStore.petFormModal.isEdit ? '编辑宠物' : '创建新宠物' }}</strong>
      </header>

      <form @submit.prevent="handleSubmit">
        <label for="petName">名字</label>
        <input type="text" id="petName" v-model="petStore.petFormModal.data.name" required>

        <label for="petBday">生日</label>
        <input type="date" id="petBday" v-model="petStore.petFormModal.data.birthday">

        <label for="petSpecies">物种</label>
        <select id="petSpecies" v-model="petStore.petFormModal.data.speciesId" required>
          <option disabled :value="null">请选择物种</option>
          <option v-for="s in dictStore.species" :value="s.id" :key="s.id">{{ s.itemLabel }}</option>
        </select>

        <label for="petBreed">品种</label>
        <select id="petBreed" v-model="petStore.petFormModal.data.breedId">
          <option :value="null">请选择品种 (可选)</option>
          <option v-for="b in filteredBreeds" :value="b.id" :key="b.id">{{ b.itemLabel }}</option>
        </select>

        <footer>
          <button type="button" class="secondary" @click="petStore.closeAllPetModals()">取消</button>
          <button type="submit" :aria-busy="petStore.petFormModal.loading">保存</button>
        </footer>
      </form>
    </article>
  </dialog>
</template>
