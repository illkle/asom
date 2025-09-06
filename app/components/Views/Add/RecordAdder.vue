<template>
  <Dialog v-model:open="newFileOpened" @update:open="newFileName = ''">
    <DialogTrigger class="w-full" as-child>
      <slot />
    </DialogTrigger>

    <DialogContent>
      <div ref="dialogRef" class="flex flex-col gap-4">
        <DialogTitle> Create new file </DialogTitle>

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

        <template v-if="apiConnection.q.data.value && apiConnection.q.data.value.type !== 'none'">
          <ApiSearchRouter
            :connection="apiConnection.q.data.value"
            @select="(id, attrs) => addThing(id, attrs)"
          />
        </template>

        <Input v-model:model-value="newFileName" placeholder="Filename" autofocus />

        <Button variant="outline" size="default" @click="() => addThing()"> Create </Button>

        <DialogDescription></DialogDescription>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { path as tauriPath } from '@tauri-apps/api';
import { exists } from '@tauri-apps/plugin-fs';
import path from 'path-browserify';
import { toast } from 'vue-sonner';
import { c_save_file } from '~/api/tauriActions';
import ApiSearchRouter from '~/components/Api/ApiSearchRouter.vue';
import { RadioGroup } from '~/components/Modules/CustomRadio';
import RadioGroupItem from '~/components/Modules/CustomRadio/RadioGroupItem.vue';
import { useNavigationBlock, useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
import type { RecordFromDb } from '~/types';

const inputRef = useTemplateRef<HTMLInputElement>('inputRef');

const newFileOpened = ref(false);
useNavigationBlock(newFileOpened);

const tabsStore = useTabsStoreV2();

const { schemasArray } = useUsableSchemas();

const selectedSchemaIndex = ref<number | null>(null);

const selectedSchema = computed(() => {
  if (selectedSchemaIndex.value === null) return null;
  return schemasArray.value[selectedSchemaIndex.value];
});

const pathFromTab = computed(() => {
  if (!tabsStore.openedItem || !tabsStore.openedItem._path) return '';
  if (tabsStore.openedItem._type === 'file') return path.dirname(tabsStore.openedItem._path);

  if (tabsStore.openedItem._type === 'folder') return tabsStore.openedItem._path;

  return '';
});

const schemaFromActiveTab = useSchemaByPath(pathFromTab);
const apiConnection = useApiConnection(computed(() => selectedSchema.value?.[0] ?? ''));

const schemaFromActiveTabIndex = computed(() => {
  return schemasArray.value.findIndex(([p]) => p === schemaFromActiveTab.data.value?.owner_folder);
});

watch(newFileOpened, (v) => {
  if (v) {
    if (schemaFromActiveTabIndex.value >= 0) {
      selectedSchemaIndex.value = schemaFromActiveTabIndex.value;
    } else {
      selectedSchemaIndex.value = 0;
    }
  }
});

const newFileName = ref('');

const addThing = async (nameInput?: string, attrsInput?: RecordFromDb['attrs']) => {
  const name = nameInput ?? newFileName.value;

  const actualName = name.endsWith('.md') ? name : name + '.md';

  if (!name.length) {
    console.log('no name', name, newFileName.value);
    toast.error('Please enter a non empty file name');
    return;
  }

  const saveTo =
    selectedSchemaIndex.value === schemaFromActiveTabIndex.value
      ? pathFromTab.value
      : (selectedSchema.value?.[0] ?? '');

  if (!saveTo) {
    console.error('no saveTo', saveTo);
    return;
  }

  const finalPath = await tauriPath.join(saveTo, actualName);

  const ex = await exists(finalPath);
  if (ex) {
    console.log('file exists', finalPath);
    toast.error('File with this name already exists');
    return;
  }

  await c_save_file({
    path: finalPath,
    attrs: attrsInput ?? {},
    markdown: '',
    modified: null,
  });

  tabsStore.openNewThingFast({ _type: 'file', _path: finalPath }, 'last');
  newFileOpened.value = false;
};

const isMacOS = useIsMac();

const hasApi = computed(() => {
  return apiConnection.q.data.value && apiConnection.q.data.value.type !== 'none';
});

const dialogRef = useTemplateRef<HTMLDivElement>('dialogRef');

const focusHandler = () => {
  if (!dialogRef.value) return;

  const a = dialogRef.value?.querySelector(`input[autofocus]`);
  if (a) {
    (a as HTMLInputElement).focus();
  }
};

watch(
  [selectedSchemaIndex, newFileOpened],
  ([_, opened]) => {
    if (opened) {
      focusHandler();
    }
  },
  { flush: 'post' },
);
</script>
