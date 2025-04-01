<script setup lang="ts">
import type { Interval } from 'date-fns';
import { addMonths, clamp, format, parse, startOfMonth } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import DaysRenderer from './DaysRenderer.vue';

import BasicInput from '~/components/_UI/BasicInput.vue';
import { useSettingsStore } from '~/composables/stores/useSettingsStore';

const s = useSettingsStore();

// Input is a date string in a format that you can change in settings
// This function converts it do js Date
const stringToDate = (dateString: string) => {
  if (!s.settings) {
    throw new Error('No settings loaded');
  }
  return parse(dateString, s.settings.dateFormat, new Date());
};
const dateToString = (date: Date) => {
  if (!s.settings) {
    throw new Error('No settings loaded');
  }
  return format(date, s.settings.dateFormat);
};

const props = defineProps<{
  modelValue?: string;
  limits?: {
    start?: string;
    end?: string;
  };
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string): void;
}>();

const computedLimits = computed(() => {
  const res = {
    start: props.limits?.start ? stringToDate(props.limits.start) : new Date(1970, 0, 1),
    end: props.limits?.end ? stringToDate(props.limits.end) : new Date(2050, 0, 1),
  };
  return res as Interval;
});

const convertedModelValue = computed(() =>
  props.modelValue ? stringToDate(props.modelValue) : undefined,
);

// Day in a month we are currently looking at
const cursor = ref(startOfMonth(props.modelValue ? stringToDate(props.modelValue) : new Date()));

const currentMonthString = computed(() => format(cursor.value, 'MMMM'));

const allMonths = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const setMonth = (monthString: string) => {
  const i = allMonths.findIndex((v) => v === monthString);
  if (i < 0) return;
  const cur = cursor.value.getMonth();
  if (i === cur) return;

  moveDirection.value = i - cursor.value.getMonth() < 0 ? -1 : 1;

  cursor.value = new Date(cursor.value.getFullYear(), i, cursor.value.getDate());
};

const currentYearInputValue = ref(cursor.value.getFullYear());

watch(currentYearInputValue, (year) => {
  const yearNum = Number(year);

  if (yearNum < 1970 || yearNum > 2100) return;
  if (yearNum === cursor.value.getFullYear()) return;

  moveDirection.value = yearNum - cursor.value.getFullYear() < 0 ? -1 : 1;

  cursor.value = new Date(yearNum, cursor.value.getMonth(), cursor.value.getDate());
});

const currentYearInputBlurHandler = () => {
  currentYearInputValue.value = cursor.value.getFullYear();
};

// Whetner to transiton to new month from left or right
const moveDirection = ref(0);
const moveCursorMonths = (n: number) => {
  cursor.value = clamp(addMonths(cursor.value, n), computedLimits.value);

  moveDirection.value = n < 0 ? -1 : 1;
};

const recordDate = (day: number) => {
  emits(
    'update:modelValue',
    dateToString(new Date(cursor.value.getFullYear(), cursor.value.getMonth(), day)),
  );
};

// Animation: transition between months
const previousCursor = ref();
const isAnimating = ref(false);
const animationOffTimeout = ref();

watch(cursor, (_, oldVal) => {
  previousCursor.value = oldVal;

  if (animationOffTimeout.value) {
    clearTimeout(animationOffTimeout.value);
  }

  isAnimating.value = true;

  animationOffTimeout.value = setTimeout(() => {
    isAnimating.value = false;
  }, 300);
});

const currentMonthClass = computed(() => {
  if (!isAnimating.value) return '';
  return moveDirection.value === 1 ? 'inRight' : 'inLeft';
});

const previousMonth = computed(() => {
  if (!isAnimating.value) return '';
  return moveDirection.value === 1 ? 'outLeft' : 'outRight';
});

// Animaton: height transition
const height = ref(0);
const transitionHeigth = ref(false);

const elementWithNumbersRef = ref<HTMLElement>();

const updateHeight = () => {
  if (!elementWithNumbersRef.value) return;
  const bcr = elementWithNumbersRef.value.getBoundingClientRect();
  height.value = bcr.height;
};

onMounted(() => {
  updateHeight();
  transitionHeigth.value = true;
  nextTick(() => {});
});

watch(cursor, () => {
  nextTick(() => {
    updateHeight();
  });
});
</script>

<template>
  <div class="">
    <div class="flex items-center justify-between gap-2">
      <Button variant="outline" size="icon" @click="moveCursorMonths(-1)">
        <ChevronLeftIcon class="w-5" />
      </Button>

      <Select :model-value="allMonths[cursor.getMonth()]" @update:model-value="setMonth">
        <SelectTrigger class="h-6 w-24 justify-center border-none px-0 py-0 text-center" hide-icon>
          {{ currentMonthString }}
        </SelectTrigger>
        <SelectContent class="max-h-[200px]">
          <SelectItem
            v-for="(month, i) in allMonths"
            size="xs"
            variant="outline"
            :key="month"
            :value="month"
          >
            {{ month }}
          </SelectItem>
        </SelectContent>
      </Select>

      <BasicInput
        v-model:number="currentYearInputValue"
        is-number
        theme="Hidden"
        class="w-16 text-center"
        @blur="currentYearInputBlurHandler"
      />

      <Button variant="outline" size="icon" @click="moveCursorMonths(1)">
        <ChevronRightIcon class="w-5" />
      </Button>
    </div>
    <div
      class="heightTransition relative mt-2 w-64 overflow-hidden"
      :style="{ height: transitionHeigth ? height + 'px' : 'auto' }"
    >
      <div
        ref="elementWithNumbersRef"
        :key="cursor.toDateString()"
        class="grid w-fit grid-cols-7 gap-1"
        :class="currentMonthClass"
      >
        <DaysRenderer
          :cursor="cursor"
          :limits="computedLimits"
          :selected="convertedModelValue"
          @click-day="recordDate"
        />
      </div>
      <div
        v-if="isAnimating"
        :key="previousCursor.toDateString()"
        class="absolute top-0 left-0 grid w-fit grid-cols-7 gap-1"
        :class="previousMonth"
      >
        <DaysRenderer
          :cursor="previousCursor"
          :limits="computedLimits"
          :selected="convertedModelValue"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.heightTransition {
  transition: 0.3s height cubic-bezier(0.07, 0.56, 0.43, 0.88);
}

.inLeft,
.inRight,
.outLeft,
.outRight {
  animation-duration: 0.3s;
}

.inRight,
.inLeft {
  animation-timing-function: cubic-bezier(0.07, 0.56, 0.43, 0.88);
}

.outLeft,
.outRight {
  animation-timing-function: cubic-bezier(0.07, 0.56, 0.43, 0.88);
}

.inRight {
  animation-name: inRight;
}

.inLeft {
  animation-name: inLeft;
}
.outLeft {
  animation-name: outLeft;
}

.outRight {
  animation-name: outRight;
}

@keyframes inRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes inLeft {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes outLeft {
  from {
    opacity: 1;
    transform: translateX(0);
  }

  to {
    opacity: 0;
    transform: translateX(-100%);
  }
}

@keyframes outRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }

  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
