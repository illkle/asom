<template>
  <div class="w-full">
    <div class="gap-2 w-full grid grid-cols-4 px-2 py-4 border rounded-t-md">
      <h5 class="text-xs text-muted-foreground">Key</h5>
      <h5 class="text-xs text-muted-foreground">Label</h5>
      <h5 class="text-xs text-muted-foreground">Type</h5>
      <div></div>

      <Input
        v-model="item.name"
        placeholder="Name"
        class="w-full"
        autofocus
        @blur="editing = false"
      />

      <Input v-model="item.value.settings.displayName" />

      <Select v-model:model-value="item.value.type">
        <SelectTrigger class="w-full">
          {{ item.value.type }}
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="k in SchemaItemKeys" :value="k">{{ k }}</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" @click="emit('delete')"> <TrashIcon class="w-5" /> Delete </Button>
    </div>

    <div
      class="w-full flex items-center flex-wrap gap-2 justify-center border border-b-0 border-t-0 px-2 py-4 empty:hidden"
    >
      <SchemaItemParams v-model:model-value="item" />
    </div>

    <div class="p-4 border rounded-lg flex items-center justify-center rounded-t-none">
      <AttributesRouter
        v-model:model-value="value"
        :schema-item="item"
        :disabled="item.value.type === 'Image'"
        hide-label
        class="mt-2 w-full"
        :class="{ 'max-w-xs': item.value.type === 'Image' }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon } from 'lucide-vue-next';
import type { AttrValue, SchemaItem } from '~/types';
import { SchemaItemKeys } from '~/types';
import AttributesRouter from '../Editor/AttributesRouter.vue';
import { getValByType } from './mocks';
import SchemaItemParams from './SchemaItemParams.vue';

const item = defineModel<SchemaItem>({ required: true });

const lastType = ref<SchemaItem['value']['type'] | null>(null);

watch(
  item.value.value,
  (newVal) => {
    if (lastType.value === null) {
      lastType.value = newVal.type;
      return;
    }

    if (lastType.value !== newVal.type) {
      lastType.value = newVal.type;
    }
  },
  { deep: true, immediate: true },
);

const value = ref<AttrValue>({
  type: 'String',
  value: '',
});

watch(
  item,
  (v) => {
    value.value = getValByType(v.value.type);
  },
  { immediate: true, deep: true },
);

const editing = ref(false);

const props = defineProps<{
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete'): void;
  (e: 'customize'): void;
}>();
</script>
