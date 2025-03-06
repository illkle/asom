<script setup lang="ts">
import { computed } from 'vue';
import { format, parse } from 'date-fns';
import { ChevronDown, CalendarDays } from 'lucide-vue-next';
import BasicCalendar from './BasicCalendar.vue';

import { useSettings } from '~/utils/settingsStore';

const { settings } = useSettings();

const props = defineProps<{
  limits?: {
    start?: string;
    end?: string;
  };
}>();

const modelValue = defineModel<string>({
  required: false,
  default: undefined,
});

const formattedDate = computed(() => {
  if (!settings) {
    throw new Error('No settings loaded');
  }
  if (!modelValue.value) return 'Select Date';

  const parsed = parse(modelValue.value, settings.dateFormat, new Date());
  return format(parsed, 'dd MMMM yyyy');
});

const isOpened = ref(false);
</script>

<template>
  <ShPopover>
    <ShPopoverTrigger>
      <ShButton class="flex w-60 justify-between gap-6" variant="outline">
        <div class="flex items-center gap-3">
          <CalendarDays class="w-4" />
          {{ formattedDate }}
        </div>
        <ChevronDown class="w-4 opacity-50" />
      </ShButton>
    </ShPopoverTrigger>
    <ShPopoverContent>
      <BasicCalendar
        v-model:model-value="modelValue"
        :limits="limits"
        @update:model-value="
          (v) => {
            isOpened = false;
          }
        "
      >
      </BasicCalendar>
    </ShPopoverContent>
  </ShPopover>
</template>
