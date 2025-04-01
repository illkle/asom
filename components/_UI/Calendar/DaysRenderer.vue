<script setup lang="ts">
import type { Interval } from 'date-fns';
import { getDaysInMonth, getISODay, isAfter, isBefore, isSameMonth } from 'date-fns';
import { computed } from 'vue';

const props = defineProps<{
  cursor: Date;
  selected?: Date;
  limits: Interval;
  disabled?: boolean;
}>();

const emits = defineEmits<{
  (e: 'clickDay', day: number): void;
}>();

// Array of numbers for each day of the month [1, 2, 3...]
const dates = computed(() => {
  return Array(getDaysInMonth(props.cursor))
    .fill(0)
    .map((_, i) => i + 1);
});

// Makes array with number of days from monday to 1st day of the month
const firstDayDate = computed(
  () => new Date(props.cursor.getFullYear(), props.cursor.getMonth(), 1),
);
const prefaceWith = computed(() => getISODay(firstDayDate.value) - 1);
const prepend = computed(() => Array(prefaceWith.value).fill(0));

const inLimit = (day: number) => {
  const date = new Date(props.cursor.getFullYear(), props.cursor.getMonth(), day);

  if (isBefore(date, props.limits.start) || isAfter(date, props.limits.end)) return false;
  return true;
};

const recordDate = (day: number) => {
  if (!inLimit(day) || props.disabled) return;
  emits('clickDay', day);
};

const higlight = computed(() =>
  props.selected && isSameMonth(props.selected, props.cursor) ? props.selected.getDate() : -1,
);
</script>

<template>
  <div v-for="(_, i) in prepend" :key="i"></div>

  <Button
    v-for="day in dates"
    :key="day"
    class="h-8 w-8"
    :disabled="!inLimit(day)"
    :variant="day === higlight ? 'default' : 'ghost'"
    :class="day === higlight ? 'cursor-default' : ''"
    size="icon"
    @click="recordDate(day)"
  >
    {{ day }}
  </Button>
</template>
