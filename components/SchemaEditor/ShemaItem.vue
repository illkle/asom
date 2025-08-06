<template>
  <div class="w-full gap-4 flex border-b py-4">
    <div class="w-full">
      <div class="flex flex-col gap-1 w-full">
        <div class="flex gap-2 flex-col justify-between">
          <h5 class="text-xs text-muted-foreground">Item key</h5>
          <Input
            v-model="item.name"
            placeholder="Name"
            class="w-full"
            autofocus
            @blur="editing = false"
          />
        </div>
        <div class="flex flex-col gap-2 mt-2">
          <h5 class="text-xs text-muted-foreground">Type</h5>
          <div class="flex gap-2 items-center">
            <Select v-model:model-value="item.value.type">
              <SelectTrigger class="w-full">
                {{ item.value.type }}
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="k in SchemaItemKeys" :value="k">{{ k }}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" @click="emit('delete')">
              <DeleteIcon class="w-5" /> Delete
            </Button>
          </div>
        </div>
      </div>

      <h5 class="text-xs text-muted-foreground mt-4 mb-2">Preview</h5>
      <div class="p-4 border rounded-lg flex items-center justify-center">
        <AttributesRouter
          v-model:model-value="value"
          :schema-item="item"
          :disabled="item.value.type === 'Image'"
          hide-label
          class="mt-2 w-full"
        />
      </div>
      <span v-if="item.value.type === 'Image'" class="text-xs text-muted-foreground">
        Sorry, working preview for image type is not implemented yet :(
      </span>
    </div>
    <div class="w-full">
      <SchemaEditorShemaItemParams v-model:model-value="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { XIcon as DeleteIcon } from 'lucide-vue-next';
import type { AttrValue, SchemaItem } from '~/types';
import { SchemaItemKeys } from '~/types';
import AttributesRouter from '../Editor/AttributesRouter.vue';
import { getValByType } from './mocks';

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
      item.value.value.settings = {};
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
