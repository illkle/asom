<template>
  <AddAndSearch
    v-if="selectedSchema"
    v-model:opened="modalOpened"
    :selected-schema="selectedSchema[1]"
    :selected-schema-path="selectedSchemaPath"
    @handle-add-empty="handleAddEmpty"
    @handle-add-from-api="handleFromApiMutation.mutate"
  >
    <template #default> <slot /> </template>
    <template #extra-controls>
      <RecordAdderRadio
        v-if="schemasArray.length > 1"
        :model-value="selectedSchemaIndex"
        @update:model-value="(v) => (userSelectedSchemaIndex = v ?? null)"
        :schemas-array="schemasArray"
        class="mt-2 mb-2"
      />
    </template>
  </AddAndSearch>
</template>

<script lang="ts" setup>
import { path } from '@tauri-apps/api';
import { computedAsync, useMagicKeys } from '@vueuse/core';
import type { ApiSettings } from '~/components/Api/apis';
import { provideApiSaveInProgress } from '~/components/Api/base';
import { makeFileAttrsFromApi, type APIEmitData } from '~/components/Api/makeFileFromApi';
import { handleOurErrorWithNotification } from '~/components/Core/Errors/errors';
import { useRootPathInjectSafe } from '~/composables/data/providers';
import { useNavigationBlock, useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
import type { ErrFR } from '~/types';
import AddAndSearch from './AddAndSearch.vue';
import { addThing } from './recordAdder';
import RecordAdderRadio from './RecordAdderRadio.vue';

const isMac = useIsMac();
const { control, command, n } = useMagicKeys();

watchEffect(() => {
  if ((!isMac.value && control?.value) || (isMac.value && command?.value)) {
    if (n?.value) {
      modalOpened.value = true;
    }
  }
});

const modalOpened = ref(false);
useNavigationBlock(modalOpened);

const tabsStore = useTabsStoreV2();

const pathFromTab = computedAsync(async () => {
  if (!tabsStore.openedItem || !tabsStore.openedItem._path) return '';
  if (tabsStore.openedItem._type === 'file') return await path.dirname(tabsStore.openedItem._path);
  if (tabsStore.openedItem._type === 'folder') return await tabsStore.openedItem._path;
  return '';
});

const { schemasArray } = useUsableSchemas();

const schemaFromActiveTab = useSchemaByPath(pathFromTab);

const schemaFromActiveTabIndex = computed(() => {
  const index = schemasArray.value.findIndex(
    ([p]) => p === schemaFromActiveTab.data.value?.location.schema_owner_folder,
  );
  return index < 0 ? null : index;
});

const userSelectedSchemaIndex = ref<number | null>(null);

const selectedSchemaIndex = computed(() => {
  return userSelectedSchemaIndex.value ?? schemaFromActiveTabIndex.value ?? 0;
});

const selectedSchema = computed(() => {
  return schemasArray.value[selectedSchemaIndex.value];
});

const selectedSchemaPath = computed(() => {
  if (!selectedSchema.value) return '';
  return selectedSchema.value[0];
});

watch(modalOpened, (v) => {
  if (v) {
    if (!v) {
      userSelectedSchemaIndex.value = null;
    }
  }
});

const saveTo = computed(() => {
  if (userSelectedSchemaIndex.value === schemaFromActiveTabIndex.value) {
    return pathFromTab.value;
  }
  return selectedSchemaPath.value;
});

const rootPath = useRootPathInjectSafe();

const saveInProgress = ref<string>('');

provideApiSaveInProgress(saveInProgress);

const handleFromApiMutation = useMutation({
  onMutate: (data) => {
    if (!data.apiData.id) return;
    saveInProgress.value = data.apiData.id;
  },
  onSettled() {
    saveInProgress.value = '';
  },
  mutation: async (data: APIEmitData<ApiSettings>) => {
    const attrs = await makeFileAttrsFromApi({
      data,
      rootPath: rootPath.value,
    });

    if (!saveTo.value) {
      return;
    }

    const filePath = await addThing({
      name: data.recordName,
      attrsInput: attrs,
      saveTo: saveTo.value,
    });

    if (!filePath) {
      console.error('No file path returned');
      return;
    }

    tabsStore.openNewThingFast({ _type: 'file', _path: filePath }, 'last');
    modalOpened.value = false;
  },
  onError(e) {
    console.error(e);
    handleOurErrorWithNotification({
      title: 'Error adding record',
      info: 'Please try again',
      rawError: e.message,
      isError: true,
      subErrors: [],
    } satisfies ErrFR);
  },
});

const handleAddEmpty = async (inputValue: string) => {
  if (!saveTo.value) {
    return;
  }

  const fillFromFilename = selectedSchema.value?.[1].fill_from_filename;

  const filePath = await addThing({
    name: inputValue,
    attrsInput: fillFromFilename
      ? { [fillFromFilename]: { type: 'String', value: inputValue } }
      : {},
    saveTo: saveTo.value,
  });

  if (!filePath) {
    console.error('No file path returned');
    return;
  }

  tabsStore.openNewThingFast({ _type: 'file', _path: filePath }, 'last');
  modalOpened.value = false;
};
</script>
