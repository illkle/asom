<script setup lang="ts">
import { format, parse } from 'date-fns';
import { CalendarDays, ChevronDown } from 'lucide-vue-next';
import { computed } from 'vue';
import BasicCalendar from './BasicCalendar.vue';

import { useSettingsStore } from '~/composables/stores/useSettingsStore';

const s = useSettingsStore();

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
  if (!s.settings) {
    throw new Error('No settings loaded');
  }
  if (!modelValue.value) return 'Select Date';

  const parsed = parse(modelValue.value, s.settings.dateFormat, new Date());
  return format(parsed, 'dd MMMM yyyy');
});

const isOpened = ref(false);
</script>

<template>
  <Popover>
    <PopoverTrigger>
      <Button class="flex w-60 justify-between gap-6" variant="outline">
        <div class="flex items-center gap-3">
          <CalendarDays class="w-4" />
          {{ formattedDate }}
        </div>
        <ChevronDown class="w-4 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent>
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
    </PopoverContent>
  </Popover>
</template>
