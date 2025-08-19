<template>
  <PageTemplate :data-pending="!schema">
    <template v-if="schema">
      <!-- Header -->
      <div class="sticky -top-5 z-10 pb-2 rounded-b-md bg-background">
        <div class="flex justify-between items-center gap-2">
          <h2 class="text-3xl font-serif">Edit schema</h2>
          <div class="text-xs text-muted-foreground max-w-1/2">
            {{ shortPath }}
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
        <SchemaItem
          v-for="(_, i) in schema.items"
          v-model:model-value="schema.items[i]!"
          :selected="selectedItemIndex === i"
          @delete="deleteItem(i)"
          @customize="selectedItemIndex = i"
        />
        <Button @click="addNew" variant="outline" class="col-span-4 mt-2 w-full">Add</Button>
      </div>
    </template>
  </PageTemplate>
</template>

<script setup lang="ts">
import { isOurError, useRustErrorNotification } from '~/composables/useRustErrorNotifcation';

import { c_load_schema, c_save_schema, returnErrorHandler } from '~/api/tauriActions';

import { useTabsStoreV2, type IOpened } from '~/composables/stores/useTabsStoreV2';
import type { ErrFR, Schema } from '~/types';
import PageTemplate from './PageTemplate.vue';
import SchemaItem from './SchemaItem.vue';

const root = useRootPath();

const tabsStore = useTabsStoreV2();

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});

const shortPath = computed(() => {
  return props.opened._path.replace(root.data.value ?? '', '');
});

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const selectedItemIndex = ref<number | null>(null);

const goBack = () => {
  tabsStore.moveBack();
};

const save = async () => {
  if (!schema.value) return;
  const r = await c_save_schema(props.opened._path, schema.value).catch(returnErrorHandler);
  if ('isError' in r) {
    useRustErrorNotification(r);
    return;
  }
  goBack();
};

const schema = ref<Schema | null>(null);

onMounted(async () => {
  try {
    const res = await c_load_schema(props.opened._path);
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
