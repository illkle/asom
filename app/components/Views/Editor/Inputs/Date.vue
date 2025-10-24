<script setup lang="ts">
import { format } from 'date-fns';
import { CalendarIcon, XIcon } from 'lucide-vue-next';
import { computed } from 'vue';
import CommonLabel from './CommonLabel.vue';

const props = defineProps<{
  limits?: {
    start?: string;
    end?: string;
  };
  name?: string;
  hideLabel?: boolean;
  class?: string;
  disabled?: boolean;
  deletable?: boolean;
  deletableInside?: boolean;
}>();

const modelValue = defineModel<string | null>({ default: null });

const { dateModel } = useDateAdapterModel(modelValue);

const start = computed(() => fileStringToDate(props.limits?.start));
const end = computed(() => fileStringToDate(props.limits?.end));

const formattedDate = computed(() => {
  if (!dateModel.value) return 'Select Date';

  return format(new Date(dateModel.value.toString()), 'dd MMM yyyy');
});

const formattedDateSM = computed(() => {
  if (!dateModel.value) return '—';

  return format(new Date(dateModel.value.toString()), 'dd.MM.yy');
});
</script>

<template>
  <Popover class="">
    <PopoverTrigger
      as="div"
      class="flex flex-col justify-start w-full overflow-hidden @container"
      v-bind="$attrs"
    >
      <CommonLabel v-if="!hideLabel" class="block mb-0.5">{{ name }}</CommonLabel>

      <div class="flex w-full">
        <Button
          :disabled="disabled"
          variant="outline"
          :class="
            cn(
              'w-full  grow shrink justify-start text-left font-normal',
              !dateModel && 'text-muted-foreground',
              props.class,
              deletable && 'rounded-r-none border-r-0',
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
        <Button
          v-if="deletable"
          variant="outline"
          size="icon"
          class="rounded-l-none m-0"
          :disabled="disabled || !dateModel"
          @click="() => $emit('update:modelValue', null)"
        >
          <XIcon class="w-4 opacity-50" />
        </Button>
      </div>
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
      <Button
        v-if="deletableInside"
        variant="ghost"
        size="sm"
        class="w-full mb-2 disabled:opacity-0"
        @click="() => $emit('update:modelValue', null)"
      >
        Remove Date
      </Button>
    </PopoverContent>
  </Popover>
</template>
