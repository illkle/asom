<template>
  {{ displayValue }}
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { BookFromDb, SchemaItem } from '~/types';

const props = defineProps({
  schemaItem: {
    type: Object as PropType<SchemaItem>,
    required: true,
  },
  book: {
    type: Object as PropType<BookFromDb>,
    required: true,
  },
});

const displayValue = computed(() => {
  const i = props.book.attrs[props.schemaItem.name];
  if (!i) return '';

  switch (i.type) {
    case 'DateReadVec':
      return i.value?.map((v) => v.started).join(', ') ?? '';
    case 'StringVec':
      return i.value?.join(', ') ?? '';
    case 'String':
      return i.value;
    case 'Integer':
      return i.value ? i.value.toString() : '';
    case 'Float':
      return i.value ? i.value.toString() : '';
  }
});
</script>
