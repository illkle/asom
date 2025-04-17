<template>
  <div class="w-full">
    <CommonLabel v-if="name">{{ name }}</CommonLabel>

    <div class="flex flex-col gap-2 w-fit">
      <div v-for="(date, index) in modelValue" :key="index" class="flex items-center">
        <DateInput
          v-model="date.started"
          :limits="{ end: date.finished }"
          class="rounded-r-none min-w-40 grow-0"
        />
        <DateInput
          v-model="date.finished"
          :limits="{ start: date.started }"
          class="rounded-none border-l-0 border-r-0 w-fit min-w-40 grow-0"
        />

        <Button
          variant="outline"
          size="icon"
          class="rounded-l-none border-l-0"
          @click="removeDate(index)"
        >
          <XIcon class="w-4 opacity-50" />
        </Button>
      </div>
      <Button variant="outline" size="sm" class="" @click="addNewDate">
        <PlusIcon :size="16" /> Log Dates
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { format } from 'date-fns';
import { PlusIcon, XIcon } from 'lucide-vue-next';
import type { DatePair } from '~/types';
import CommonLabel from './CommonLabel.vue';
import DateInput from './Date.vue';

const props = defineProps<{
  name: string;
}>();

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
