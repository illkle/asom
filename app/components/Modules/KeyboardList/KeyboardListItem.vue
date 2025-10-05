<template>
  <div
    :data-list-item-parent="ctx.listContextId"
    :data-list-item="itemId"
    :data-list-selected="ctx.selectedItemId.value === itemId"
    class="data-[list-selected=true]:bg-accent group relative"
  >
    <div
      class="absolute top-0 left-0 w-full h-full hidden items-center bg-muted/50 justify-center group-data-[is-loading=true]:flex"
    >
      <LoaderAnimated />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import LoaderAnimated from '~/components/Modules/LoaderAnimated.vue';
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
