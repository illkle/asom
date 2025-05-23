<script setup lang="ts">
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-vue-next';
import { computed } from 'vue';
import Calendar from '~/components/ui/calendar/Calendar.vue';

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

const isOpened = ref(false);
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        :disabled="disabled"
        variant="outline"
        :class="
          cn(
            'min-w-40 grow justify-start text-left font-normal',
            !dateModel && 'text-muted-foreground',
            props.class,
          )
        "
      >
        <CalendarIcon class="mr-2 h-4 w-4" />

        {{ formattedDate }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar v-model="dateModel" initial-focus />
    </PopoverContent>
  </Popover>
</template>
