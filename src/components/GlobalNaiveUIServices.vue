<script setup>
import { defineComponent, h } from 'vue';
import { useMessage, useDialog, useNotification, useLoadingBar } from 'naive-ui';

// This component exists solely to inject Naive UI's global services
// into the window object, making them accessible outside of Vue components.
const GlobalNaiveUIServices = defineComponent({
  setup() {
    window.$message = useMessage();
    window.$dialog = useDialog();
    window.$notification = useNotification();
    window.$loadingBar = useLoadingBar();
    return () => h('div'); // Render nothing
  }
});
</script>

<template>
  <GlobalNaiveUIServices />
</template>
