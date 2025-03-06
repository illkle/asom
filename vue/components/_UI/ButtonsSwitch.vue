<template>
  <div
    class="flex w-fit overflow-hidden rounded-md border border-neutral-200 bg-transparent shadow-sm dark:border-neutral-800"
  >
    <div
      v-for="option in options"
      :key="option.key"
      class="px-2 py-1 transition-colors"
      :class="[
        modelValue === option.key
          ? 'bg-neutral-200 dark:bg-neutral-800'
          : 'cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800',
        optionClasses,
      ]"
      @click="emitKey(option)"
    >
      <slot name="option" v-bind="{ option, active: modelValue === option.key }"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

export type ISwitchOption = { key: string | number; [key: string]: unknown };

const props = defineProps({
  options: {
    type: Array as PropType<ISwitchOption[]>,
    required: true,
  },
  modelValue: {
    type: [String, Number],
    default: null,
  },
  optionClasses: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  // eslint-disable-next-line ~/typescript-eslint/no-explicit-any
  (e: 'update:modelValue', key: any): void;
}>();

const emitKey = (option: ISwitchOption) => {
  emit('update:modelValue', option.key);
};
</script>

<style scoped></style>
