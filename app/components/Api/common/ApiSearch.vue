<template>
  <div class="relative group">
    <LoaderCircle
      v-if="props.query.isLoading.value"
      class="animate-spin absolute right-2 top-1/2 -translate-y-1/2"
    />

    <Input
      v-model="search"
      autofocus
      :placeholder="props.placeholder"
      class="w-full pr-4"
      @keydown.down.prevent="
        () => {
          highlightedIndex = clamp(highlightedIndex + 1, 0, items.length - 1);
        }
      "
      @keydown.up.prevent="
        () => {
          highlightedIndex = clamp(highlightedIndex - 1, 0, items.length - 1);
        }
      "
      @keydown.enter="
        () => {
          const item = items[highlightedIndex];
          if (item) {
            emits('select', item);
          }
        }
      "
    />

    <div
      class="absolute top-full translate-y-2 left-0 w-full z-10 bg-background group-focus-within:block border-ring ring-ring/50 ring-[3px] rounded-md"
    >
      <div
        class="flex flex-col max-h-[300px] h-full overflow-y-auto scrollbarMod border border-t-0 rounded-md"
      >
        <button
          v-for="(item, index) in items"
          :key="index"
          :id="`${id}-${index}`"
          class="flex gap-4 hover:bg-muted py-2 px-2"
          :class="{ 'bg-muted': highlightedIndex === index }"
          @click="
            () => {
              console.log('click', item);
              emits('select', item);
            }
          "
        >
          <slot name="item" :item="item" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends ExApiSchema">
import type { UseQueryReturn } from '@pinia/colada';
import { LoaderCircle } from 'lucide-vue-next';
import type { ExApiData, ExApiSchema } from '../base';

const search = defineModel<string>();

const props = defineProps<{
  query: UseQueryReturn<ExApiData<T>[], unknown>;
  placeholder: string;
}>();

const items = computed(() => props.query.data.value ?? []);

const emits = defineEmits<{
  (e: 'select', item: ExApiData<T>): void;
}>();

const highlightedIndex = ref(0);

const id = useId();

watch(highlightedIndex, (newIndex) => {
  const next = document.getElementById(`${id}-${newIndex}`);
  if (next) {
    next.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});
</script>
