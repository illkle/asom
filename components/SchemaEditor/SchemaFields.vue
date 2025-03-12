<template>
  <div v-if="schema" class="flex flex-col gap-4">
    <div class="flex items-center gap-4">
      <ShButton variant="ghost" size="icon" @click="goBack">
        <ArrowLeftIcon class="w-4" />
      </ShButton>
      <h1 class="font-serif text-3xl">{{ schema.name }}</h1>

      <ShButton variant="outline" @click="save">Save</ShButton>
    </div>

    <div class="max-w-[600px]">
      <div>
        <ShInput v-model="schema.name" />
      </div>

      <div>
        Icon from Lucide

        <p>CamelCase style: StarHalf, BookAudio, etc.</p>

        <div class="mb-2 flex gap-2">
          <UIBasicInput size="S" v-model="schema.icon" />
          <UIDynamicIcon :name="schema.icon" />
        </div>
      </div>

      <div>
        <div class="grid grid-cols-[40px_3fr_1fr_40px] gap-x-2 gap-y-2">
          <template v-for="(_, i) in schema.items" class="flex gap-2">
            <SchemaEditorShemaItem v-model:model-value="schema.items[i]" @delete="deleteItem(i)" />
          </template>
          <ShButton @click="addNew" variant="outline" class="col-span-4 mt-2 w-full">Add</ShButton>
        </div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isOurError, useRustErrorNotification } from '~/composables/useRustErrorNotifcation';

import { ArrowLeftIcon } from 'lucide-vue-next';
import { c_load_schema, c_save_schema, returnErrorHandler } from '~/api/tauriActions';

import type { ErrFR, Schema } from '~/types';

const route = useRoute();

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
