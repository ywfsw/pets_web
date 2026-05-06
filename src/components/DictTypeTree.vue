<script setup>
import { computed } from 'vue';
import { NTree } from 'naive-ui';

const props = defineProps({
  treeData: {
    type: Array,
    default: () => []
  },
  selectedCode: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['update:selectedCode', 'select']);

const formattedTreeData = computed(() => {
  return props.treeData.map(node => ({
    key: node.dictCode,
    label: `${node.dictName} (${node.dictCode})`,
    ...node, // Pass along the original object
    children: node.children?.map(child => ({
      key: child.dictCode,
      label: `${child.dictName} (${child.dictCode})`,
      ...child,
    }))
  }));
});

const handleUpdateSelectedKeys = (keys, options) => {
  if (keys.length > 0) {
    const selectedKey = keys[0];
    emit('update:selectedCode', selectedKey);
    // options 中可能包含 null，需要安全处理
    let node = options?.[0] ?? null;
    // 如果 options[0] 为 null，尝试从 treeData 中查找对应节点
    if (!node) {
      node = findNodeByKey(selectedKey) ?? null;
    }
    emit('select', node);
  } else {
    emit('update:selectedCode', null);
    emit('select', null);
  }
};

// 在 treeData（含 children）中递归查找 key 匹配的节点
const findNodeByKey = (key) => {
  for (const node of formattedTreeData.value) {
    if (node.key === key) return node;
    if (node.children) {
      for (const child of node.children) {
        if (child.key === key) return child;
      }
    }
  }
  return null;
};

</script>

<template>
  <n-tree
    block-line
    :data="formattedTreeData"
    :selected-keys="selectedCode ? [selectedCode] : []"
    :on-update:selected-keys="handleUpdateSelectedKeys"
    key-field="key"
    label-field="label"
    children-field="children"
    default-expand-all
    selectable
  />
</template>
