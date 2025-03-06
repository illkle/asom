<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import { DialogTitle, type DialogTitleProps, useForwardProps } from 'radix-vue';
import { cn } from '~/utils/sh';

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <DialogTitle
    v-bind="forwardedProps"
    :class="cn('font-serif text-3xl font-light leading-none tracking-wide', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
