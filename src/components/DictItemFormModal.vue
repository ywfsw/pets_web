<script setup>
import { ref, reactive, watch } from 'vue';

// (❗) 导入 API 层
import { fetchDictParentOptions } from '@/api.js';

// --- 1. Props (接收父组件数据) ---
const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  contextType: { // (❗) 传入的上下文 (e.g., PET_BREED 对象)
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  // (TODO: 编辑时的数据)
});

// --- 2. Emits (通知父组件) ---
const emit = defineEmits(['close', 'save']);

// --- 3. State (内部状态) ---
const loadingForm = ref(false);
const loadingOptions = ref(false);
const parentOptions = ref([]);

const defaultForm = () => ({
  dictCode: '',
  itemLabel: '',
  itemValue: '',
  parentId: null,
  sortOrder: 0
});

const formData = reactive(defaultForm());

// --- 4. Logic (核心逻辑) ---

/**
 * (❗) 监听 'open'  prop
 */
watch(() => props.open, (newVal) => {
  if (newVal) {
    // 1. (❗) 重置表单
    Object.assign(formData, defaultForm());

    // 2. (❗) 设置上下文
    if (props.contextType) {
      formData.dictCode = props.contextType.dictCode;

      // 3. (❗) 触发加载父级下拉框
      loadOptions(props.contextType.parentCode);
    }

  } else {
    parentOptions.value = []; // 清空下拉框
  }
});

/**
 * (❗) 加载父级下拉框
 */
const loadOptions = async (parentDictCode) => {
  loadingOptions.value = true;
  parentOptions.value = [];
  try {
    const response = await fetchDictParentOptions(parentDictCode);
    parentOptions.value = response.data;
  } catch (err) {
    console.error("加载父级选项失败:", err);
  } finally {
    loadingOptions.value = false;
  }
};

/**
 * (❗) 处理表单提交
 */
const handleSubmit = () => {
  loadingForm.value = true;
  const payload = {
    ...formData,
    parentId: formData.parentId || null
  };

  emit('save', payload, () => {
    loadingForm.value = false;
  });
};

</script>

<template>
  <dialog :open="open" @click.self="emit('close')">
    <article :aria-busy="loadingForm || loadingOptions">
      <header>
        <a href="#" aria-label="Close" class="close" @click.prevent="emit('close')"></a>
        <strong>{{ isEdit ? '编辑字典项' : '创建新字典项' }}</strong>
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
                :disabled="loadingOptions || !contextType?.parentCode">

          <option :value="null" v-if="!contextType?.parentCode">(无父级)</option>
          <option :value="null" v-else-if="!loadingOptions && parentOptions.length === 0">(无选项)</option>
          <option :value="null" v-else>(请选择...)</option>

          <option v-for="opt in parentOptions" :value="opt.id" :key="opt.id">
            {{ opt.label }}
          </option>
        </select>

        <label for="dictSort">排序</label>
        <input type="number" id="dictSort" v-model="formData.sortOrder">

        <footer>
          <button type="button" class="secondary" @click="emit('close')">取消</button>
          <button type="submit" :aria-busy="loadingForm">保存</button>
        </footer>
      </form>
    </article>
  </dialog>
</template>

<style scoped>
/* (无样式) */
</style>
