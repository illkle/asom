<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import { SelectIcon, SelectTrigger, type SelectTriggerProps, useForwardProps } from 'radix-vue';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from '~/utils/sh';

const props = defineProps<
  SelectTriggerProps & { class?: HTMLAttributes['class']; hideIcon?: boolean }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-start text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300 [&>span]:truncate',
        props.class,
      )
    "
  >
    <slot />
    <SelectIcon v-if="!props.hideIcon" as-child>
      <ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>
