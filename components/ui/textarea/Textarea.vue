<script setup lang="ts">
import { cn } from '@/lib/utils';
import { useTextareaAutosize, useVModel } from '@vueuse/core';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  defaultValue?: string | number;
  modelValue?: string | number;
  placeholder?: string;
  autoResize?: boolean;
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const valueProxy = computed(() => String(modelValue.value ?? ''));

const { textarea } = useTextareaAutosize({ input: valueProxy });
</script>

<template>
  <textarea
    :ref="props.autoResize ? 'textarea' : undefined"
    v-model="modelValue"
    data-slot="textarea"
    :class="
      cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        props.autoResize ? 'scrollbarReset resize-none' : 'scrollbarMod  resize-y',
        props.class,
      )
    "
    :placeholder="placeholder"
  />
</template>

<style scoped>
.scrollbarReset {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbarReset::-webkit-scrollbar {
  display: none;
}
</style>
