<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import { ContextMenuSeparator, type ContextMenuSeparatorProps } from 'radix-vue';
import { cn } from '~/utils/sh';

const props = defineProps<ContextMenuSeparatorProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <ContextMenuSeparator
    v-bind="delegatedProps"
    :class="cn('-mx-1 my-1 h-px bg-neutral-200 dark:bg-neutral-800', props.class)"
  />
</template>
