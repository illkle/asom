<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '~/utils/sh';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <tr
    :class="
      cn(
        'border-b border-neutral-200 transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800',
        props.class,
      )
    "
  >
    <slot />
  </tr>
</template>
