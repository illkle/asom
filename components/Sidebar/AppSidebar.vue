<template>
  <Sidebar variant="floating" collapsible="icon">
    <SidebarContent class="">
      <SidebarGroup class="">
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
import { CogIcon, PlusIcon, WrenchIcon } from 'lucide-vue-next';
import path from 'path-browserify';
import { useTabsStore } from '~/composables/stores/useTabsStore';

const { schemasArray } = useUsableSchemas();

const tabsStore = useTabsStore();

const pathToSave = computed(() => {
  if (!tabsStore.openedItem) return null;
  if (tabsStore.openedItem.type === 'file') return path.basename(tabsStore.openedItem.id);

  if (tabsStore.openedItem.type === 'folder') return tabsStore.openedItem.thing;

  return null;
});

const openGoodreadsImporter = () => {
  tabsStore.openNewOne(
    {
      id: generateUniqId(),
      type: 'innerPage',
      thing: 'goodreadsImporter',
      scrollPosition: 0,
    },
    {
      place: 'last',
      focus: true,
    },
  );
};
</script>
