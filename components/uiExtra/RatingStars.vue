<template>
  <div
    class="flex h-fit fill-foreground relative w-fit"
    :class="!disabled && 'cursor-pointer'"
    ref="target"
    @click="$emit('update:modelValue', hoveredValue)"
  >
    <div v-for="index in starsCount" :key="index" class="relative h-fit">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        stroke="var(--border)"
        :fill="`url(#${id}-grad-${index})`"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-star"
      >
        <defs>
          <linearGradient :id="`${id}-grad-${index}`">
            <stop
              :offset="getFill(index, isHovering ? hoveredValue : modelValue)"
              stop-color="var(--primary)"
            />
            <stop
              :offset="getFill(index, isHovering ? hoveredValue : modelValue)"
              stop-color="transparent"
            />
          </linearGradient>
        </defs>
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        />
      </svg>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useMouseInElement } from '@vueuse/core';

const id = useId();

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 5,
  },
  decimalPlaces: {
    type: Number,
    default: 0,
  },
  starsCount: {
    type: Number,
    default: 5,
  },
});
const modelValue = defineModel<number | null>({ required: true });

const target = useTemplateRef<HTMLDivElement>('target');
const mouseInElement = useMouseInElement(target);

const isHovering = computed(() => {
  return !mouseInElement.isOutside.value && !props.disabled;
});

/**
 * In stars we treat decimal places as star subdivision. So with decimal places 1 you can set "2 and a half star" with 2 you can "2 and one quater" etc.
 */
const incrementMult = computed(() => Math.max(props.decimalPlaces * 2, 1));

// maps 0-1 value from hover position to modelvalue
const fromHoverToValue = computed(() => {
  return (v: number | null) => {
    if (v === null) return null;
    const clamped = props.min + (props.max - props.min) * v;
    return Math.round(clamped * incrementMult.value) / incrementMult.value;
  };
});

const hoveredValue = computed(() =>
  isHovering.value
    ? fromHoverToValue.value(mouseInElement.elementX.value / mouseInElement.elementWidth.value)
    : null,
);

const getFill = (index: number, displayedValue: number | null) => {
  if (displayedValue === null) return '0%';
  const displayedValueInPercent = ((displayedValue - props.min) / (props.max - props.min)) * 100;
  const oneStarWidth = 100 / props.starsCount;

  const myStart = oneStarWidth * (index - 1);
  const myEnd = myStart + oneStarWidth;

  return range(myStart, myEnd, 0, 100, displayedValueInPercent) + '%';
};
</script>

<style scoped></style>
