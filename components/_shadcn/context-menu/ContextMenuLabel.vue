<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import { ContextMenuLabel, type ContextMenuLabelProps } from 'radix-vue';
import { cn } from '~/utils/sh';

const props = defineProps<
  ContextMenuLabelProps & { class?: HTMLAttributes['class']; inset?: boolean }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <ContextMenuLabel
    v-bind="delegatedProps"
    :class="
      cn(
        'px-2 py-1.5 text-sm font-semibold text-neutral-950 dark:text-neutral-50',
        inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot />
  </ContextMenuLabel>
</template>
