<script setup>
// (❗) 这是一个“哑组件 (Dumb Component)”
// 它只负责接收数据 (props) 和发送事件 (emits)

// 1. (Props) 定义它能接收的数据
// 'treeData' 是从 Pinia 拿到的 dictTypeTree
// 'selectedCode' 是当前选中的 code
defineProps({
  treeData: {
    type: Array,
    default: () => [] // 默认空数组
  },
  selectedCode: {
    type: String,
    default: null
  }
});

// 2. (Emits) 定义它能发出的事件
// (当用户点击一个类型时, 我们要"通知"父组件)
const emit = defineEmits(['select']);

// 3. (Handler) 内部点击事件
const handleSelect = (type) => {
  // (❗) 发射事件，把被点击的 type 对象传出去
  emit('select', type);
};
</script>

<template>
  <article>
    <header>
      <strong>字典类型 (只读)</strong>
    </header>
    <ul style="padding-left: 0; list-style: none;">

      <li v-for="type in treeData" :key="type.dictCode">

        <details :open="type.children && type.children.length > 0">

          <summary>
            <a href="#"
               :style="{ color: type.dictCode === selectedCode ? 'var(--pico-primary)' : 'inherit' }"
               @click.prevent="handleSelect(type)">
              {{ type.dictName }} (<code>{{ type.dictCode }}</code>)
            </a>
          </summary>

          <ul v-if="type.children && type.children.length > 0"
              style="padding-left: 1rem; margin-top: 0.5rem;">

            <li v-for="child in type.children" :key="child.dictCode">
              <a href="#"
                 :style="{ color: child.dictCode === selectedCode ? 'var(--pico-primary)' : 'inherit' }"
                 @click.prevent="handleSelect(child)">
                {{ child.dictName }} (<code>{{ child.dictCode }}</code>)
              </a>
            </li>
          </ul>

        </details>
      </li>
    </ul>
  </article>
</template>

<style scoped>
/* 'scoped': 这里的 CSS 只对这个组件生效
  (保持 Pico.css 默认 <details> 样式)
*/
summary {
  cursor: pointer;
}
</style>
