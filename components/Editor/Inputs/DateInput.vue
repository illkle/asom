<script setup lang="ts">
import { format } from 'date-fns';
import { CalendarDays, ChevronDown } from 'lucide-vue-next';
import { computed } from 'vue';

import { useSettingsStore } from '~/composables/stores/useSettingsStore';

const s = useSettingsStore();

const props = defineProps<{
  limits?: {
    start?: string;
    end?: string;
  };
}>();

const modelValue = defineModel<string | undefined>({
  required: false,
  default: undefined,
});

const { stringToDate } = useDateHooks();
const { dateModel } = useDateAdapterModel(modelValue);

const start = computed(() => stringToDate(props.limits?.start));
const end = computed(() => stringToDate(props.limits?.end));

const formattedDate = computed(() => {
  if (!dateModel.value) return 'Select Date';
  return format(new Date(dateModel.value.toString()), 'dd MMMM yyyy');
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
    <PopoverContent class="">
      <Calendar v-model="dateModel" :min-value="start" :max-value="end"> </Calendar>
    </PopoverContent>
  </Popover>
</template>
