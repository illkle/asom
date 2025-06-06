<template>
  <div class="w-full">
    <CommonLabel v-if="!hideLabel">{{ name }}</CommonLabel>

    <div class="flex flex-col gap-1 w-full overflow-hidden">
      <div v-for="(date, index) in modelValue" :key="index" class="flex items-center">
        <DateInput
          v-model="date.started"
          :limits="{ end: date.finished }"
          hide-label
          class="rounded-r-none grow-0"
          :disabled="disabled"
        />
        <DateInput
          v-model="date.finished"
          :limits="{ start: date.started }"
          hide-label
          class="rounded-none border-l-0 grow-0"
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
      <Button variant="outline" class="w-full" @click="addNewDate" :disabled="disabled">
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
  hideLabel?: boolean;
  disabled?: boolean;
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
