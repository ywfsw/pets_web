<script setup>
import { ref, reactive, watch } from 'vue';

// (❗) 导入 API 层 (只为加载下拉框)
import { fetchDictParentOptions } from '@/api.js';
// (❗) 导入 Store (读/写状态)
import { useDictionaryStore } from '@/stores/dictionaryStore.js';

const dictStore = useDictionaryStore();

// --- 3. State (内部状态) ---
const defaultForm = () => ({
  dictCode: '', itemLabel: '', itemValue: '', parentId: null, sortOrder: 0
});
const formData = reactive(defaultForm());

const loadingOptions = ref(false);
const parentOptions = ref([]);

// --- 4. Logic (核心逻辑) ---

/**
 * (❗) 监听 store 中的 'show' 状态
 */
watch(() => dictStore.itemFormModal.show, (newVal) => {
  if (newVal) {
    const { contextType, data, isEdit } = dictStore.itemFormModal;

    if (isEdit) {
      Object.assign(formData, data);
    } else {
      Object.assign(formData, defaultForm());
      formData.dictCode = contextType.dictCode;
    }

    loadOptions(contextType.parentCode);

  } else {
    parentOptions.value = [];
  }
});

const loadOptions = async (parentDictCode) => {
  loadingOptions.value = true;
  parentOptions.value = [];
  try {
    const response = await fetchDictParentOptions(parentDictCode);
    parentOptions.value = response.data;
  } catch (err) { console.error("加载父级选项失败:", err); }
  finally { loadingOptions.value = false; }
};

/**
 * (❗) 提交表单, 直接调用 store action
 */
const handleSubmit = () => {
  const payload = {
    ...formData,
    parentId: formData.parentId || null
  };
  dictStore.handleSaveItem(payload);
};

</script>

<template>
  <dialog :open="dictStore.itemFormModal.show" @click.self="dictStore.closeDictItemModal()">
    <article :aria-busy="dictStore.itemFormModal.loading || loadingOptions">
      <header>
        <a href="#" aria-label="Close" class="close" @click.prevent="dictStore.closeDictItemModal()"></a>
        <strong>{{ dictStore.itemFormModal.isEdit ? '编辑字典项' : '创建新字典项' }}</strong>
      </header>

      <form @submit.prevent="handleSubmit">
        <label for="dictCode">字典编码 (Code)</label>
        <input type="text" id="dictCode" v-model="formData.dictCode" required readonly disabled>

        <label for="dictLabel">标签 (Label)</label>
        <input type="text" id="dictLabel" v-model="formData.itemLabel" required>

        <label for="dictValue">值 (Value)</label>
        <input type="text" id="dictValue" v-model="formData.itemValue" required>

        <label for="dictParent">父级ID (可选)</label>
        <select id="dictParent"
                v-model="formData.parentId"
                :aria-busy="loadingOptions"
                :disabled="loadingOptions || !dictStore.itemFormModal.contextType?.parentCode">

          <option :value="null" v-if="!dictStore.itemFormModal.contextType?.parentCode">(无父级)</option>
          <option :value="null" v-else-if="!loadingOptions && parentOptions.length === 0">(无选项)</option>
          <option :value="null" v-else>(请选择...)</option>

          <option v-for="opt in parentOptions" :value="opt.id" :key="opt.id">
            {{ opt.label }}
          </option>
        </select>

        <label for="dictSort">排序</label>
        <input type="number" id="dictSort" v-model="formData.sortOrder">

        <footer>
          <button type="button" class="secondary" @click="dictStore.closeDictItemModal()">取消</button>
          <button type="submit" :aria-busy="dictStore.itemFormModal.loading">保存</button>
        </footer>
      </form>
    </article>
  </dialog>
</template>
