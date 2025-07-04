<template>
  <Sidebar variant="floating" collapsible="icon">
    <SidebarContent class="">
      <SidebarGroup class="">
        <div class="flex flex-row gap-1 w-full mb-4" :class="{ 'pl-16': isMac }">
          <Button
            :disabled="!tabsStore.canGoBack"
            variant="ghost"
            size="sm"
            class="flex-1 text-xs h-6"
            @click="tabsStore.moveBack()"
          >
            <ArrowLeft :size="12" />
          </Button>
          <Button
            :disabled="!tabsStore.canGoForward"
            variant="ghost"
            size="sm"
            class="flex-1 h-6 text-xs"
            @click="tabsStore.moveForward()"
          >
            <ArrowRight :size="12" />
          </Button>
        </div>

        <IconsMenuBookAdder class="">
          <Button variant="outline" size="sm" class="w-full text-xs">
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
      <Collapsible defaultOpen class="group">
        <CollapsibleContent>
          <SidebarMenuButton @click="openGoodreadsImporter">
            <ImportIcon /> Goodreads importer
          </SidebarMenuButton>
        </CollapsibleContent>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <WrenchIcon /> Tools
            <ChevronLeft
              class="ml-auto group-data-[state=open]:rotate-90 transition-transform duration-200"
              :size="12"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
      </Collapsible>

      <Dialog v-model:open="settingsDialogOpened">
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
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  CogIcon,
  ImportIcon,
  PlusIcon,
  WrenchIcon,
} from 'lucide-vue-next';
import { useNavigationBlock, useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
import { useIsMac } from '~/composables/useTools';

const { schemasArray } = useUsableSchemas();

const tabsStore = useTabsStoreV2();

const isMac = useIsMac();

const openGoodreadsImporter = () => {
  tabsStore.openNewThingFast({ _type: 'innerPage', _path: 'goodreadsImporter' }, 'last');
};

const settingsDialogOpened = ref(false);
useNavigationBlock(settingsDialogOpened);
</script>
