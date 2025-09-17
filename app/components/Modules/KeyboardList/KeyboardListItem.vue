<template>
  <div
    :data-list-item-parent="ctx.listContextId"
    :data-list-item="itemId"
    :data-list-selected="ctx.selectedItemId.value === itemId"
    class="data-[list-selected=true]:bg-accent"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useKeyboardListContext } from './useKeyboardListManager';

const props = defineProps<{
  isDefault?: boolean;
}>();

const ctx = useKeyboardListContext();

const emit = defineEmits<{
  (e: 'select'): void;
}>();

const itemId = useId();
onMounted(() => {
  ctx.registerItem(
    itemId,
    {
      onSelect: () => {
        emit('select');
      },
    },
    props.isDefault,
  );
});

onUnmounted(() => {
  ctx.unregisterItem(itemId);
});
</script>
