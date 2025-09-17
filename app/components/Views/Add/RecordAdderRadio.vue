<template>
  <div
    :data-list-item-parent="ctx.listContextId"
    :data-list-item="itemId"
    :data-list-selected="ctx.selectedItemId.value === itemId"
    class="data-[list-selected=true]:border-ring data-[list-selected=true]:ring-ring/50 data-[list-selected=true]:ring-[3px] rounded-md"
  >
    <RadioGroup v-if="schemasArray.length > 1" v-model="selectedSchemaIndex" class="w-full">
      <RadioGroupItem
        v-for="(schema, index) in schemasArray"
        :key="schema[0]"
        :value="index"
        :label="schema[1].name"
        class="w-full"
      >
        {{ schema[1].name }}
      </RadioGroupItem>
    </RadioGroup>
  </div>
</template>

<script setup lang="ts">
import { RadioGroup, RadioGroupItem } from '~/components/Modules/CustomRadio';
import type { Schema } from '~/types';
import { useKeyboardListContext } from '../../Modules/KeyboardList/useKeyboardListManager';

const selectedSchemaIndex = defineModel<number>();

const props = defineProps<{
  schemasArray: [string, Schema][];
}>();

const select = (type: 'next' | 'previous') => {
  if (typeof selectedSchemaIndex.value !== 'number') return;

  const newIndex = clamp(
    type === 'next' ? selectedSchemaIndex.value + 1 : selectedSchemaIndex.value - 1,
    0,
    props.schemasArray.length - 1,
  );
  selectedSchemaIndex.value = newIndex;
};

const ctx = useKeyboardListContext();

const itemId = useId();
onMounted(() => {
  ctx.registerItem(itemId, {
    onLeft: (e) => {
      select('previous');
      e.preventDefault();
      return false;
    },
    onRight: (e) => {
      select('next');
      e.preventDefault();
      return false;
    },
  });
});

onUnmounted(() => {
  ctx.unregisterItem(itemId);
});
</script>
