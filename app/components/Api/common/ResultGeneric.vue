<template>
  <component
    :is="WrapperInject ?? 'button'"
    v-for="(item, index) in props.query.data.value"
    :key="index"
    class="flex gap-4 hover:bg-muted py-2 px-2"
    @click="emits('select', item)"
    @select="emits('select', item)"
  >
    <slot name="item" :item="item" />
  </component>
  <div v-if="props.query.isLoading.value" class="w-full h-full z-20">
    <div class="animate-spin flex items-center justify-center">
      <LoaderCircle :size="16" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends ExApiSchema">
import type { UseQueryReturn } from '@pinia/colada';
import { LoaderCircle } from 'lucide-vue-next';
import type { ExApiData, ExApiSchema } from '../base';
import { useResultGenericWrapper } from './resultGeneric';

const props = defineProps<{
  query: UseQueryReturn<ExApiData<T>[], unknown>;
}>();

const emits = defineEmits<{
  (e: 'select', item: ExApiData<T>): void;
}>();

const WrapperInject = useResultGenericWrapper();
</script>
