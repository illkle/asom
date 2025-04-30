<template>
  <div class="w-full rounded">
    <CommonLabel v-if="!hideLabel">{{ name }}</CommonLabel>
    <div class="flex flex-col gap-2 w-fit" :key="key">
      <div
        v-for="(date, index) in modelValue"
        :key="index"
        class="flex w-fit items-center justify-between gap-2"
      >
        <DateInput
          :model-value="date"
          @update:model-value="(v) => updateDate(index, v)"
          :disabled="disabled"
        />
      </div>
      <Button variant="outline" size="sm" class="" @click="addNewDate" :disabled="disabled">
        <PlusIcon :size="16" /> Add Date
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { format, parse } from 'date-fns';
import { PlusIcon } from 'lucide-vue-next';
import CommonLabel from './CommonLabel.vue';
import DateInput from './Date.vue';

const props = defineProps<{
  name: string;
  disabled?: boolean;
  hideLabel?: boolean;
}>();

const datePairs = defineModel<string[] | null>();

const addNewDate = () => {
  if (!datePairs.value) {
    datePairs.value = [format(new Date(), 'yyyy-MM-dd')];
    return;
  }
  datePairs.value.push(format(new Date(), 'yyyy-MM-dd'));
};

const updateDate = (index: number, date: string | null) => {
  if (!datePairs.value) return;

  if (date) {
    datePairs.value[index] = date;
  } else {
    datePairs.value.splice(index, 1);
  }

  datePairs.value.sort(
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
