<template>
  <!-- prettier-ignore-attribute v-bind:model-value -->
  <Input
    v-if="!settings.isMultiline"
    :model-value="modelValue"
    :placeholder="settings.displayName"
    :multi-line="settings.isMultiline"
    :class="[
      extraVariants({
        theme: settings.theme,
        size: settings.size,
        font: settings.font,
        weight: settings.weight,
      }),
    ]"
    @update:model-value="(v) => $emit('update:modelValue', String(v))"
  />

  <!-- prettier-ignore-attribute v-bind:model-value -->
  <Textarea
    v-else
    :model-value="modelValue ?? ''"
    :placeholder="settings.displayName"
    :multi-line="settings.isMultiline"
    :rows="1"
    :class="[
      extraVariants({
        theme: settings.theme,
        size: settings.size,
        font: settings.font,
        weight: settings.weight,
      }),
    ]"
    @update:model-value="(v) => $emit('update:modelValue', String(v))"
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
      Hidden: 'bg-transparent border-transparent dark:bg-transparent dark:border-transparent ',
    },
    size: {
      L: 'text-4xl md:text-4xl h-auto',
      M: 'text-xl md:text-xl h-auto',
      S: 'text-xs h-fit',
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
