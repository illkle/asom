<template>
  <NumberField
    :step-snapping="false"
    :model-value="modelValue"
    @update:model-value="(v) => $emit('update:modelValue', v)"
  >
    <Label class="opacity-30">
      {{ settings.displayName || name }}
    </Label>
    <NumberFieldContent>
      <NumberFieldInput />
    </NumberFieldContent>
  </NumberField>
</template>

<script setup lang="ts">
import type { NumberSettings } from '~/types';

defineModel<number | null>({ required: true });

defineProps<{
  settings: NumberSettings;
  name: string;
}>();
</script>
