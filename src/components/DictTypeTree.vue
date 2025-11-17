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
    emit('update:selectedCode', keys[0]);
    emit('select', options[0]); // Emit the full node object for the parent
  } else {
    emit('update:selectedCode', null);
    emit('select', null);
  }
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
