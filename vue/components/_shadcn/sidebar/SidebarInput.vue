<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import Input from '~/components/_shadcn/input/Input.vue';
import { cn } from '~/utils/sh';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <Input
    data-sidebar="input"
    :class="
      cn(
        'focus-visible:ring-sidebar-ring h-8 w-full bg-white shadow-none focus-visible:ring-2 dark:bg-neutral-950',
        props.class,
      )
    "
  >
    <slot />
  </Input>
</template>
