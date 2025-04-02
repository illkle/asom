<template>
  <div
    class="flex h-fit fill-foreground"
    :class="!disabled && 'cursor-pointer'"
    @mouseleave="clearHovered"
    @click="setRating"
  >
    <div v-for="index in 5" :key="index" class="relative h-fit">
      <div class="absolute h-full w-[50%]" @mouseenter="setHovered(index - 0.5)"></div>
      <div class="absolute left-[50%] h-full w-[50%]" @mouseenter="setHovered(index)"></div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        stroke="#fff"
        :fill="getFill(index, displayedValue.value)"
        stroke-width="1"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-star"
      >
        <defs>
          <linearGradient id="grad">
            <stop offset="50%" stop-color="white" />
            <stop offset="50%" stop-color="transparent" />
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
import { computed, ref } from 'vue';

const getFill = (index: number, displayedValue: number) => {
  if (index <= displayedValue) {
    return '#fff';
  } else if (index - 0.5 === displayedValue) {
    return 'url(#grad)';
  }
  return 'none';
};

const props = defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', data: number): void;
}>();

const rating = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val);
  },
});

const hoveredRating = ref(-1);

const clearHovered = () => {
  if (props.disabled) return;
  hoveredRating.value = -1;
};

const setHovered = (val: number) => {
  if (props.disabled) return;
  hoveredRating.value = val;
};

const displayedValue = computed(() => (hoveredRating.value < 0 ? rating : hoveredRating));

const setRating = () => {
  if (props.disabled) return;
  if (hoveredRating.value >= 0) {
    rating.value = hoveredRating.value;
  }
};
</script>

<style scoped></style>
