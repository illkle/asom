<template>
  <template v-if="tabsStore.openedItem" class="h-full w-full">
    <NuxtErrorBoundary
      :key="tabsStore.openedItem._path"
      @error="
        (e) => {
          console.error(e);
        }
      "
    >
      <template #error="{ error }">
        <PageError :message="String(error)" />
      </template>
      <template #default>
        <RecordEditor
          v-if="tabsStore.openedItem._type === 'file'"
          :opened="tabsStore.openedItem"
          :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'file'"
          :class="{ 'rounded-tl': !isFirstTab }"
        />
        <ListViewWrapper
          v-else-if="tabsStore.openedItem._type === 'folder'"
          :opened="tabsStore.openedItem"
          :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'table'"
          :class="{ 'rounded-tl': !isFirstTab }"
        />
        <SchemaEditor
          v-else-if="tabsStore.openedItem._type === 'settings'"
          :opened="tabsStore.openedItem"
          :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'schema'"
          :class="{ 'rounded-tl': !isFirstTab }"
        />
        <LayoutEditor
          v-else-if="tabsStore.openedItem._type === 'settings/layout'"
          :opened="tabsStore.openedItem"
          :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'layout'"
          :class="{ 'rounded-tl': !isFirstTab }"
        />

        <ApiConnection
          v-else-if="tabsStore.openedItem._type === 'settings/api'"
          :opened="tabsStore.openedItem"
          :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'api'"
          :class="{ 'rounded-tl': !isFirstTab }"
        />

        <SchemaFieldsEditor
          v-else-if="tabsStore.openedItem._type === 'settings/schema'"
          :opened="tabsStore.openedItem"
          :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'schemaFields'"
          :class="{ 'rounded-tl': !isFirstTab }"
        />
        <ApiCredentials
          v-else-if="tabsStore.openedItem._type === 'settings/apiCredentials'"
          :opened="tabsStore.openedItem"
          :key="tabsStore.openedTabActiveId + tabsStore.openedItem._path + 'apiCredentials'"
          :class="{ 'rounded-tl': !isFirstTab }"
        />

        <GoodreadsImporter
          v-else-if="tabsStore.openedItem._type === 'innerPage/goodreadsImporter'"
        />

        <TestPage v-else-if="tabsStore.openedItem._type === 'innerPage/test'" />
      </template>
    </NuxtErrorBoundary>
  </template>

  <div v-else class="relative h-full w-full px-2 pr-4">
    <div v-if="tabsStore.initialLoadDone" class="flex flex-col items-center justify-center h-full">
      <div class="text-muted-foreground">You have nothing opened</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ApiCredentials from '~/components/Api/ApiCredentials.vue';
import GoodreadsImporter from '~/components/Api/Goodreads/GoodreadsImporter.vue';
import RecordEditor from '~/components/Views/Editor/RecordEditor.vue';
import ListViewWrapper from '~/components/Views/List/ListViewWrapper.vue';
import ApiConnection from '~/components/Views/Schema/ApiConnection/ApiConnection.vue';
import SchemaFieldsEditor from '~/components/Views/Schema/EditSchema/EditSchemaPage.vue';
import LayoutEditor from '~/components/Views/Schema/Layout/LayoutEditor.vue';
import SchemaEditor from '~/components/Views/Schema/SettingsMainPage.vue';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
import TestPage from './__preview/TestPage.vue';
import PageError from './Modules/PageError.vue';

const tabsStore = useTabsStoreV2();

const isFirstTab = computed(() => {
  return tabsStore.openedTabActiveIndex === 0;
});
</script>

<style></style>
