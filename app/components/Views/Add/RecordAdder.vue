<template>
  <Dialog v-model:open="newFileOpened" @update:open="mainInputValue = ''">
    <DialogTrigger class="w-full" as-child>
      <slot />
    </DialogTrigger>

    <DialogContent class="p-2 gap-0 top-[20vh] translate-y-0" hide-close>
      <DialogTitle></DialogTitle>
      <div ref="wrapperRef">
        <KeyboardListItem
          is-default
          class="data-[list-selected=true]:bg-transparent data-[list-selected=true]:border-ring data-[list-selected=true]:ring-ring/50 data-[list-selected=true]:ring-[3px] rounded-md"
        >
          <Input
            v-model:model-value="mainInputValue"
            placeholder="Filename or API search"
            autofocus
            class="focus-visible:ring-0"
            @keydown.down="kb.handleMove($event, 'onDown')"
            @keydown.up="kb.handleMove($event, 'onUp')"
            @keydown.left="kb.handleMove($event, 'onLeft')"
            @keydown.right="kb.handleMove($event, 'onRight')"
            @keydown.enter="
              () => {
                const res = kb.handleConfirm();

                if (!res) {
                  handleAddEmpty();
                }
              }
            "
          />
        </KeyboardListItem>

        <RecordAdderRadio
          v-if="schemasArray.length > 1 && selectedSchemaIndex !== null"
          v-model="selectedSchemaIndex"
          :schemas-array="schemasArray"
          class="mt-2 mb-2"
        />

        <ApiSearchRouter
          v-if="
            apiConnection.q.data.value &&
            apiConnection.q.data.value.type !== 'none' &&
            selectedSchema?.[1]
          "
          :search="mainInputValue"
          :schema="selectedSchema?.[1]"
          :connection="apiConnection.q.data.value"
          class="max-h-[300px] overflow-y-auto mt-2"
          @select="handleAddFromApi"
        />

        <DialogDescription></DialogDescription>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import path from 'path-browserify';
import ApiSearchRouter from '~/components/Api/ApiSearchRouter.vue';
import { provideResultGenericWrapper } from '~/components/Api/common/resultGeneric';
import KeyboardListItem from '~/components/Modules/KeyboardList/KeyboardListItem.vue';
import { useKeyboardListManager } from '~/components/Modules/KeyboardList/useKeyboardListManager';
import RecordAdderRadio from '~/components/Views/Add/RecordAdderRadio.vue';
import { useNavigationBlock, useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
import type { RecordFromDb } from '~/types';
import { addThing } from './recordAdder';

const newFileOpened = ref(false);
useNavigationBlock(newFileOpened);

const tabsStore = useTabsStoreV2();

const { schemasArray } = useUsableSchemas();

const selectedSchemaIndex = ref<number | null>(null);

const selectedSchema = computed(() => {
  if (selectedSchemaIndex.value === null) return null;
  return schemasArray.value[selectedSchemaIndex.value];
});

const selectedSchemaPath = computed(() => {
  if (!selectedSchema.value) return '';
  return selectedSchema.value[0];
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

const mainInputValue = ref('');

const wrapperRef = useTemplateRef('wrapperRef');

const kb = useKeyboardListManager(wrapperRef);

provideResultGenericWrapper(KeyboardListItem);

const saveTo = computed(() => {
  if (selectedSchemaIndex.value === schemaFromActiveTabIndex.value) {
    return pathFromTab.value;
  }
  return selectedSchemaPath.value;
});

const handleAddFromApi = async (name: string, attrs: RecordFromDb['attrs']) => {
  if (!saveTo.value) {
    return;
  }

  const filePath = await addThing({
    name,
    attrsInput: attrs,
    saveTo: saveTo.value,
  });

  if (!filePath) {
    console.error('No file path returned');
    return;
  }

  newFileOpened.value = false;
  tabsStore.openNewThingFast({ _type: 'file', _path: filePath }, 'last');
};

const handleAddEmpty = async () => {
  if (!saveTo.value) {
    return;
  }

  const fillFromFilename = selectedSchema.value?.[1].fill_from_filename;

  const filePath = await addThing({
    name: mainInputValue.value,
    attrsInput: fillFromFilename
      ? { [fillFromFilename]: { type: 'String', value: mainInputValue.value } }
      : {},
    saveTo: saveTo.value,
  });

  if (!filePath) {
    console.error('No file path returned');
    return;
  }

  newFileOpened.value = false;
  tabsStore.openNewThingFast({ _type: 'file', _path: filePath }, 'last');
};
</script>
