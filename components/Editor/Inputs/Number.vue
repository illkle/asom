<template>
  <NumberField
    v-if="settings.style === 'Default'"
    :step-snapping="false"
    :model-value="modelValue"
    :min="settings.min"
    :max="settings.max"
    :format-options="{
      minimumFractionDigits: settings.decimalPlaces,
      maximumFractionDigits: settings.decimalPlaces,
    }"
    @update:model-value="(v) => $emit('update:modelValue', v)"
  >
    <Label class="opacity-30">
      {{ settings.displayName || name }}
    </Label>
    <NumberFieldContent>
      <NumberFieldInput />
    </NumberFieldContent>
  </NumberField>
  <RatingStars
    v-else-if="settings.style === 'Stars'"
    :decimal-places="settings.decimalPlaces"
    :model-value="modelValue"
    :stars-count="settings.starsCount"
    :min="settings.min"
    :max="settings.max"
    @update:model-value="(v) => $emit('update:modelValue', v)"
  />
  <div v-else-if="settings.style === 'Slider'" class="flex items-center gap-2">
    <Slider
      :model-value="[modelValue ?? settings.min ?? 0]"
      :min="settings.min"
      :max="settings.max"
      @update:model-value="(v) => $emit('update:modelValue', v?.[0] ?? null)"
      :step="decimalToStep(settings.decimalPlaces ?? 0)"
    />
    <div class="relative px-1 py-0.5">
      <span class="font-mono opacity-30">{{ formatWithDecimalPlaces(modelValue) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import RatingStars from '~/components/uiExtra/RatingStars.vue';
import type { NumberSettings } from '~/types';
defineModel<number | null>({ required: true });

const props = defineProps<{
  settings: NumberSettings;
  name: string;
}>();

const padWith = (value: number | null) => {
  if (value === null) return 'null';
  return value.toString().padStart(maxDigits.value, '0');
};

const decimalToStep = (decimalPlaces: number) => {
  return 1 / Math.pow(10, decimalPlaces);
};

const maxDigits = computed(() => {
  return (props.settings.max?.toString().length ?? 2) + (props.settings.decimalPlaces ?? 0);
});
const placeholder = computed(() => {
  return '_'.repeat(maxDigits.value);
});

const formatWithDecimalPlaces = (value: number | null) => {
  if (value === null) return null;
  return value.toFixed(props.settings.decimalPlaces ?? 0);
};
</script>
