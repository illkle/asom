<template>
  <div v-if="schema" class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center gap-2">
      <Button variant="ghost" size="icon" @click="goBack">
        <ArrowLeftIcon class="w-4" />
      </Button>

      <Input class="font-serif" v-model="schema.name" />

      <Button variant="outline" @click="save">Save</Button>
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

import { ArrowLeftIcon } from 'lucide-vue-next';
import type { ErrFR, Schema } from '~/types';

const route = useRoute();

const selectedItemIndex = ref<number | null>(null);

const goBack = () => {
  history.back();
};

const save = async () => {
  if (!schema.value) return;
  const r = await c_save_schema(route.query.path as string, schema.value).catch(returnErrorHandler);
  if ('isError' in r) {
    useRustErrorNotification(r);
    return;
  }
  goBack();
};

const schema = ref<Schema | null>(null);

onMounted(async () => {
  try {
    const res = await c_load_schema(route.query.path as string);
    schema.value = res;
  } catch (e) {
    if (isOurError(e)) {
      useRustErrorNotification(e as ErrFR);
    }
    //  navigateTo('/schemas', { replace: true });
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
