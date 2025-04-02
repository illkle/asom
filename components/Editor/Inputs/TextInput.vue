<template>
  <!-- prettier-ignore-attribute v-bind:model-value -->
  <Input
    v-bind:model-value="(modelValue as string)"
    :placeholder="settings.displayName"
    :theme="settings.theme"
    :multi-line="settings.isMultiline"
    :class="[
      extraVariants({
        theme: settings.theme,
        size: settings.size,
        font: settings.font,
        weight: settings.weight,
      }),
    ]"
  />
</template>

<script setup lang="ts">
import { cva } from 'cva';
import type { TextSettings } from '~/types';

defineProps<{
  settings: TextSettings;
  name: string;
}>();

defineModel<string | null>({ required: true });

const extraVariants = cva({
  base: '',
  variants: {
    theme: {
      Default: '',
      Hidden: 'bg-transparent border-transparent dark:bg-transparent dark:border-transparent',
    },
    size: {
      L: 'text-4xl md:text-4xl h-auto',
      M: 'text-xl md:text-xl h-auto',
      S: '',
    },
    font: {
      Serif: 'font-serif',
      Sans: '',
    },
    weight: {
      Light: 'font-light',
      Normal: 'font-normal',
      Bold: 'font-bold',
      Black: 'font-black',
    },
  },
  defaultVariants: {
    theme: 'Default',
    size: 'S',
    font: 'Sans',
  },
});
</script>
