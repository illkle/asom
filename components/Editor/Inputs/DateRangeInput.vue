<template>
  <div class="w-full rounded">
    <div class="flex flex-col gap-2">
      <div
        v-for="(date, index) in modelValue"
        :key="index"
        class="flex w-fit items-center justify-between gap-2"
      >
        <DateInput v-model="date.started" :limits="{ end: date.finished }" />
        <MoveRightIcon class="w-4" />
        <DateInput v-model="date.finished" :limits="{ start: date.started }" />

        <Button variant="ghost" size="icon" @click="removeDate(index)">
          <XIcon class="w-4 opacity-50" />
        </Button>
      </div>
      <Button variant="ghost" size="sm" class="mt-2" @click="addNewDate"> Log new reading </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { format } from 'date-fns';
import { MoveRightIcon, XIcon } from 'lucide-vue-next';
import type { DatePair } from '~/types';
import DateInput from './DateInput.vue';

const datePairs = defineModel<DatePair[] | null>();

const addNewDate = () => {
  if (!datePairs.value) {
    datePairs.value = [{ started: format(new Date(), 'yyyy-MM-dd'), finished: undefined }];
    return;
  }
  datePairs.value.push({ started: format(new Date(), 'yyyy-MM-dd'), finished: undefined });
};

const removeDate = (index: number) => {
  if (!datePairs.value) return;
  datePairs.value.splice(index, 1);
};
</script>

<style scoped>
.customGrid {
  grid-template-columns: 6rem 32px 6rem 24px;
}
</style>
