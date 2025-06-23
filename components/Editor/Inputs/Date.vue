<script setup lang="ts">
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-vue-next';
import { computed } from 'vue';
import CommonLabel from './CommonLabel.vue';

import { useSettingsStore } from '~/composables/stores/useSettingsStore';

const s = useSettingsStore();

const props = defineProps<{
  limits?: {
    start?: string;
    end?: string;
  };
  name?: string;
  hideLabel?: boolean;
  class?: string;
  disabled?: boolean;
}>();

const modelValue = defineModel<string | null>({ default: null });

const { stringToDate } = useDateHooks();
const { dateModel } = useDateAdapterModel(modelValue);

const start = computed(() => stringToDate(props.limits?.start));
const end = computed(() => stringToDate(props.limits?.end));

const formattedDate = computed(() => {
  if (!dateModel.value) return 'Select Date';
  return format(new Date(dateModel.value.toString()), 'dd MMM yyyy');
});

const formattedDateSM = computed(() => {
  if (!dateModel.value) return '—';
  return format(new Date(dateModel.value.toString()), 'dd.MM.yy');
});

const isOpened = ref(false);
</script>

<template>
  <Popover class="">
    <PopoverTrigger class="flex flex-col w-full overflow-hidden @container">
      <CommonLabel v-if="!hideLabel" class="block mb-0.5">{{ name }}</CommonLabel>

      <Button
        :disabled="disabled"
        variant="outline"
        :class="
          cn(
            'w-full  grow shrink justify-start text-left font-normal',
            !dateModel && 'text-muted-foreground',
            props.class,
          )
        "
      >
        <CalendarIcon class="h-4 w-4 @max-[130px]:hidden" />

        <span class="@max-[100px]:hidden">
          {{ formattedDate }}
        </span>

        <span class="@max-[100px]:block hidden">
          {{ formattedDateSM }}
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <CalendarSelect
        v-model="dateModel"
        initial-focus
        :week-starts-on="1"
        :is-date-disabled="
          (date) => {
            if (start) {
              if (date < start) return true;
            }
            if (end) {
              if (date > end) return true;
            }
            return false;
          }
        "
      />
    </PopoverContent>
  </Popover>
</template>
