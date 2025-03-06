<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '~/utils/sh';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <tfoot
    :class="
      cn(
        'border-t bg-neutral-100/50 font-medium dark:bg-neutral-800/50 [&>tr]:last:border-b-0',
        props.class,
      )
    "
  >
    <slot />
  </tfoot>
</template>
