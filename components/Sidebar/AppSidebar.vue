<template>
  <Sidebar variant="floating" collapsible="icon">
    <SidebarContent class="">
      <SidebarGroup class="">
        <div class="flex flex-row gap-2 w-full mb-2">
          <Button
            :disabled="!tabsStore.canGoBack"
            variant="ghost"
            size="sm"
            class="flex-1 text-xs"
            @click="tabsStore.moveBack()"
          >
            <ArrowLeft :size="12" />
          </Button>
          <Button
            :disabled="!tabsStore.canGoForward"
            variant="ghost"
            size="sm"
            class="flex-1 text-xs"
            @click="tabsStore.moveForward()"
          >
            <ArrowRight :size="12" />
          </Button>
        </div>

        <IconsMenuBookAdder :path-to-save="pathToSave ?? ''" class="">
          <Button :disabled="!pathToSave" variant="outline" size="sm" class="w-full text-xs">
            <PlusIcon :size="12" /> Create
          </Button>
        </IconsMenuBookAdder>
      </SidebarGroup>

      <SidebarGroup v-for="[path, schema] in schemasArray" :key="path" class="py-0">
        <SidebarGroupContent>
          <FileTree :schema-path="path" :schema-name="schema.name" />
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenuButton @click="openGoodreadsImporter"> <WrenchIcon /> Tools </SidebarMenuButton>
      <Dialog>
        <DialogContent>
          <SettingsPage />
        </DialogContent>
        <DialogTrigger>
          <SidebarMenuButton> <CogIcon /> Settings </SidebarMenuButton>
        </DialogTrigger>
      </Dialog>
    </SidebarFooter>
  </Sidebar>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight, CogIcon, PlusIcon, WrenchIcon } from 'lucide-vue-next';
import path from 'path-browserify';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';

const { schemasArray } = useUsableSchemas();

const tabsStore = useTabsStoreV2();

const pathToSave = computed(() => {
  if (!tabsStore.openedItem) return null;
  if (tabsStore.openedItem._type === 'file') return path.basename(tabsStore.openedItem._path);

  if (tabsStore.openedItem._type === 'folder') return tabsStore.openedItem._path;

  return null;
});

const openGoodreadsImporter = () => {
  tabsStore.openNewThingFast({ _type: 'innerPage', _path: 'goodreadsImporter' }, 'last');
};
</script>
