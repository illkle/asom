<template>
  <PageTemplate :data-pending="!schema" tab-title="Schema editor">
    <template #title> Schema editor </template>
    <template #title-badge>
      <button v-if="showCopyButton" @click="() => toClipboard()">Copy</button>
    </template>

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
      <div
        v-if="emptyKeyWarning || duplicateKeyWarning"
        class="mb-2 border border-destructive rounded-md p-2 text-destructive text-xs flex items-center gap-2"
      >
        <TriangleAlert />
        <div>
          <div v-if="emptyKeyWarning" class="">
            You have empty key, those items will be deleted on save
          </div>
          <div v-if="duplicateKeyWarning" class="">
            You have items with duplicate keys, duplicate one will be deleted on save
          </div>
        </div>
      </div>

      <div class="gap-2 w-full grid grid-cols-2" v-if="onlyTextItems && onlyTextItems.length > 0">
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
import { c_load_schema, c_save_schema } from '~/api/tauriActions';

import { TriangleAlert } from 'lucide-vue-next';
import PageTemplate from '~/components/Views/Schema/common/PageTemplate.vue';
import SchemaItem from '~/components/Views/Schema/EditSchema/SchemaItem.vue';
import { useRootPathInjectSafe } from '~/composables/data/providers';
import { useTabsStoreV2, type IOpened } from '~/composables/stores/useTabsStoreV2';
import type { Schema } from '~/types';

const root = useRootPathInjectSafe();

const tabsStore = useTabsStoreV2();

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});

const selectedItemIndex = ref<number | null>(null);

const goBack = () => {
  tabsStore.openNewThingFast({ _type: 'settings', _path: '' });
};

const save = async () => {
  if (!schema.value) return;
  console.log(schema.value);
  await c_save_schema(props.opened._path, schema.value);
  goBack();
};

const schema = ref<Schema | null>(null);

onMounted(async () => {
  const res = await c_load_schema(props.opened._path);
  schema.value = res;
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
  return schema.value?.items.filter((v) => v.value.type == 'Text' && v.name.length > 0);
});

const emptyKeyWarning = computed(() => {
  return schema.value?.items.some((v) => v.name.length === 0);
});

const duplicateKeyWarning = computed(() => {
  const keys = new Set<string>();
  for (const item of schema.value?.items ?? []) {
    if (keys.has(item.name)) {
      return true;
    }
    keys.add(item.name);
  }
  return false;
});

const showCopyButton = false;

const toClipboard = () => {
  if (!schema.value) return;
  navigator.clipboard.writeText(JSON.stringify(schema.value, null, 2));
};
</script>
