<template>
  <div class="w-full rounded">
    <CommonLabel v-if="!hideLabel">{{ name }}</CommonLabel>
    <div class="flex flex-col gap-2 w-fit" :key="key">
      <div
        v-for="(date, index) in modelValue"
        :key="index"
        class="flex w-fit items-center justify-between"
      >
        <DateInput
          :model-value="date"
          @update:model-value="(v) => updateDate(index, v)"
          class="rounded-r-none"
          :disabled="disabled"
        />

        <Button
          variant="outline"
          size="icon"
          class="rounded-l-none border-l-0"
          :disabled="disabled"
          @click="removeDate(index)"
        >
          <XIcon class="w-4 opacity-50" />
        </Button>
      </div>
      <Button variant="outline" size="sm" class="" @click="addNewDate" :disabled="disabled">
        <PlusIcon :size="16" /> Add Date
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { format, parse } from 'date-fns';
import { PlusIcon, XIcon } from 'lucide-vue-next';
import CommonLabel from './CommonLabel.vue';
import DateInput from './Date.vue';

const props = defineProps<{
  name: string;
  disabled?: boolean;
  hideLabel?: boolean;
}>();

const dates = defineModel<string[] | null>();

const addNewDate = () => {
  if (!dates.value) {
    dates.value = [format(new Date(), 'yyyy-MM-dd')];
    return;
  }
  dates.value.push(format(new Date(), 'yyyy-MM-dd'));
};

const removeDate = (index: number) => {
  if (!dates.value) return;
  dates.value.splice(index, 1);
};

const updateDate = (index: number, date: string | null) => {
  if (!dates.value) return;

  if (date) {
    dates.value[index] = date;
  } else {
    dates.value.splice(index, 1);
  }

  dates.value.sort(
    (a, b) =>
      parse(a, 'yyyy-MM-dd', new Date()).getTime() - parse(b, 'yyyy-MM-dd', new Date()).getTime(),
  );

  /**
   * This is a hack that
   * 1. Auto closes on select in caledar
   * 2. Makes sure that if you set a date that will cause order shift you won't have modal opened for another date
   */
  key.value++;
};
const key = ref(0);
</script>

<style scoped>
.customGrid {
  grid-template-columns: 6rem 32px 6rem 24px;
}
</style>
