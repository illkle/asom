<template>
  <PageTemplate :data-pending="!schema">
    <template #title> Schema editor </template>

    <template #header>
      <div class="flex justify-between items-center gap-2 mt-2"></div>
      <div class="flex items-center gap-2">
        <div class="flex items-stretch grow">
          <h5
            class="text-xs text-muted-foreground border border-r-0 rounded-l-md whitespace-nowrap flex items-center px-2"
          >
            Schema name
          </h5>
          <Input class="font-serif rounded-l-none" v-if="schema" v-model="schema.name" />
          <Input v-else class="font-serif rounded-l-none" />
        </div>
        <Button variant="destructive" class="grow" @click="goBack"> Discard </Button>

        <Button variant="outline" class="grow" @click="save">Save</Button>
      </div>
    </template>
    <template v-if="schema">
      <div class="gap-2 w-full grid grid-cols-2">
        <h5 class="text-xs text-muted-foreground">Fill from filename</h5>

        <h5 class="text-xs text-muted-foreground">Fill api search from</h5>
        <Select v-model="schema.fill_from_filename">
          <SelectTrigger class="w-full">
            {{ schema.fill_from_filename ?? 'None' }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in onlyTextItems" :key="item.name" :value="item.name"
              >{{ item.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="schema.fill_api_search_from">
          <SelectTrigger class="w-full">
            {{ schema.fill_api_search_from ?? 'None' }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="item in onlyTextItems" :key="item.name" :value="item.name"
              >{{ item.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

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
import PageTemplate from './common/PageTemplate.vue';
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

const onlyTextItems = computed(() => {
  return schema.value?.items.filter((v) => v.value.type == 'Text');
});
</script>
