<template>
  <Sidebar variant="floating" collapsible="icon">
    <SidebarContent class="">
      <SidebarGroup v-if="!noSchemas" class="">
        <div class="flex flex-row gap-1 w-full mb-4" :class="{ 'pl-16': isMac }">
          <Button
            :disabled="!tabsStore.canGoBack"
            data-button-back
            variant="ghost"
            size="sm"
            class="flex-1 text-xs h-6"
            @click="tabsStore.moveBack()"
          >
            <ArrowLeft :size="12" />
          </Button>
          <Button
            :disabled="!tabsStore.canGoForward"
            data-button-forward
            variant="ghost"
            size="sm"
            class="flex-1 h-6 text-xs"
            @click="tabsStore.moveForward()"
          >
            <ArrowRight :size="12" />
          </Button>
        </div>

        <RecordAdder class="">
          <Button variant="outline" size="sm" class="w-full text-xs">
            <PlusIcon :size="12" /> Create
          </Button>
        </RecordAdder>
      </SidebarGroup>

      <SidebarGroup v-for="[path, schema] in schemasArray" :key="path" class="py-0">
        <SidebarGroupContent>
          <FileTree :schema-path="path" :schema-name="schema.name" />
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup v-if="noSchemas" class="py-12">
        <SidebarGroupContent>
          <div class="text-muted-foreground text-sm text-center">Zero valid schemas found</div>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <Collapsible v-if="!noSchemas" class="group">
        <CollapsibleContent>
          <SidebarMenuButton
            @click="
              tabsStore.openNewThingFast({ _type: 'settings/apiCredentials', _path: '' }, 'last')
            "
          >
            <KeyIcon /> Api credentials
          </SidebarMenuButton>
          <SidebarMenuButton
            v-if="isDev"
            @click="tabsStore.openNewThingFast({ _type: 'innerPage/test', _path: '' }, 'last')"
          >
            <ImportIcon /> Test page
          </SidebarMenuButton>
          <SidebarMenuButton
            @click="
              tabsStore.openNewThingFast(
                { _type: 'innerPage/goodreadsImporter', _path: '' },
                'last',
              )
            "
          >
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

      <SidebarMenuButton
        class="w-full"
        variant="outline"
        @click="tabsStore.openNewThingFast({ _type: 'settings', _path: '' }, 'last')"
      >
        <CogIcon /> Root Path & Schemas
      </SidebarMenuButton>
      <ColorModeSelector />
      <CheckUpdates />
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
  KeyIcon,
  PlusIcon,
  WrenchIcon,
} from 'lucide-vue-next';
import RecordAdder from '~/components/Views/Add/RecordAdder.vue';
import { useNavigationBlock, useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
import { useIsMac } from '~/composables/useTools';
import FileTree from '../FileTree/FileTree.vue';
import ColorModeSelector from '../Modules/ColorModeSelector.vue';
import CheckUpdates from './CheckUpdates.vue';

const { schemasArray } = useUsableSchemas();

const tabsStore = useTabsStoreV2();

const isMac = useIsMac();

const settingsDialogOpened = ref(false);
useNavigationBlock(settingsDialogOpened);

const noSchemas = computed(() => schemasArray.value.length === 0);

const isDev = import.meta.dev;
</script>
