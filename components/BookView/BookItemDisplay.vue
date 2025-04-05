<template>
  <div class="text-ellipsis w-full overflow-hidden whitespace-nowrap">
    {{ displayValue }}
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { AttrValue } from '~/types';

const props = defineProps({
  value: {
    type: Object as PropType<AttrValue>,
    required: true,
  },
});

const displayValue = computed(() => {
  const i = props.value;
  if (!i) return '';

  switch (i.type) {
    case 'DatePairVec':
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
