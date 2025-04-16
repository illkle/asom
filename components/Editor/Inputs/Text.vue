<template>
  <!-- prettier-ignore-attribute v-bind:model-value -->
  <Input
    v-if="!settings.isMultiline"
    :model-value="modelValue ?? ''"
    :placeholder="settings.displayName ?? name"
    :multi-line="settings.isMultiline"
    :class="[
      extraInputVariants({
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
    :placeholder="settings.displayName ?? name"
    :multi-line="settings.isMultiline"
    :rows="1"
    :class="[
      extraInputVariants({
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
import type { TextSettings } from '~/types';
import { extraInputVariants } from './helpers';
defineProps<{
  settings: TextSettings;
  name: string;
}>();

defineModel<string | null>({ required: true });
</script>
