<template>
  <CommonLabel>{{ name }}</CommonLabel>
  <RatingStars
    v-if="settings.style === 'Stars'"
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
      <span class="font-mono opacity-30 whitespace-pre">{{
        formatWithDecimalPlaces(modelValue)
      }}</span>
    </div>
  </div>
  <NumberField
    v-else
    :step-snapping="false"
    :model-value="modelValue === null ? undefined : modelValue"
    :min="settings.min"
    :max="settings.max"
    :format-options="{
      minimumFractionDigits: settings.decimalPlaces,
      maximumFractionDigits: settings.decimalPlaces,
      useGrouping: false,
    }"
    :disable-wheel-change="true"
    @update:model-value="(v) => $emit('update:modelValue', v)"
  >
    <NumberFieldContent>
      <NumberFieldInput :class="numberInputVariants({ size: settings.size })" />
    </NumberFieldContent>
  </NumberField>
</template>

<script setup lang="ts">
import RatingStars from '~/components/uiExtra/RatingStars.vue';
import type { NumberSettings } from '~/types';
import CommonLabel from './CommonLabel.vue';
import { numberInputVariants } from './helpers';
defineModel<number | null>({ required: true });

const props = defineProps<{
  settings: NumberSettings;
  name: string;
}>();

const decimalToStep = (decimalPlaces: number) => {
  return 1 / Math.pow(10, decimalPlaces);
};

const formatWithDecimalPlaces = (value: number | null) => {
  const v = (value ?? props.settings.min ?? 0).toFixed(props.settings.decimalPlaces ?? 0);

  if (v.length !== maxValue.value.length) {
    return v.padStart(maxValue.value.length, ' ');
  }

  return v;
};

const maxValue = computed(() => {
  return (props.settings.max ?? 10).toFixed(props.settings.decimalPlaces ?? 0);
});

const minValue = computed(() => {
  return (props.settings.min ?? 0).toFixed(props.settings.decimalPlaces ?? 0);
});
</script>
