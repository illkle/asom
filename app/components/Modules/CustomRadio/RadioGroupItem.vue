<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import type { RadioGroupItemProps } from 'reka-ui';
import { RadioGroupItem, useForwardProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <RadioGroupItem v-bind="forwardedProps" as-child>
    <template #default="{ checked }">
      <button
        :class="
          cn(
            'px-3 py-1.5 text-sm',
            'border shadow-xs ',
            'peer rounded-none first:rounded-l-md last:rounded-r-md border-l-0 first:border-l ',
            'bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
            'data-[state=checked]:bg-primary dark:data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:hover:bg-primary/90',
            props.class,
          )
        "
      >
        <slot /></button
    ></template>
  </RadioGroupItem>
</template>
