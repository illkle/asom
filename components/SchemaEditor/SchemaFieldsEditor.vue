<template>
  <div v-if="schema" class="flex flex-col gap-4 max-w-4xl pb-16 w-full mx-auto">
    <!-- Header -->
    <div class="sticky top-0 pt-8 z-10 pb-2 rounded-b-md bg-background">
      <div class="flex justify-between items-center gap-2">
        <h2 class="text-3xl font-serif">Edit schema</h2>
        <div class="text-sm text-muted-foreground text-center">
          {{ props.path }}
        </div>
      </div>
      <div class="flex items-center gap-2 mt-4">
        <Input class="font-serif" v-model="schema.name" />
        <Button variant="destructive" @click="goBack"> Discard </Button>

        <Button variant="outline" @click="save">Save</Button>
      </div>
    </div>

    <!-- Editor -->

    <div class="flex flex-col gap-x-2 gap-y-2 mt-4">
      <SchemaEditorShemaItem
        v-for="(_, i) in schema.items"
        v-model:model-value="schema.items[i]"
        :selected="selectedItemIndex === i"
        @delete="deleteItem(i)"
        @customize="selectedItemIndex = i"
      />
      <Button @click="addNew" variant="outline" class="col-span-4 mt-2 w-full">Add</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isOurError, useRustErrorNotification } from '~/composables/useRustErrorNotifcation';

import { c_load_schema, c_save_schema, returnErrorHandler } from '~/api/tauriActions';

import type { ErrFR, Schema } from '~/types';

const props = defineProps<{
  path: string;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const selectedItemIndex = ref<number | null>(null);

const goBack = () => {
  emit('back');
};

const save = async () => {
  if (!schema.value) return;
  const r = await c_save_schema(props.path as string, schema.value).catch(returnErrorHandler);
  if ('isError' in r) {
    useRustErrorNotification(r);
    return;
  }
  goBack();
};

const schema = ref<Schema | null>(null);

onMounted(async () => {
  try {
    const res = await c_load_schema(props.path as string);
    schema.value = res;
  } catch (e) {
    if (isOurError(e)) {
      useRustErrorNotification(e as ErrFR);
    }
  }
});

const addNew = () => {
  if (!schema.value) return;
  schema.value.items.push({
    name: '',
    value: { type: 'Text', settings: { settingsType: 'Text' } },
  });
};
const deleteItem = (index: number) => {
  if (!schema.value) return;
  schema.value.items.splice(index, 1);
};
</script>
