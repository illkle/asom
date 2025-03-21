<template>
  <ShSidebar :class="$props.class" variant="floating" collapsible="icon">
    <ShSidebarContent class="py-3">
      <SidebarGroup class="px-2">
        <IconsMenuBookAdder :path-to-save="pathToSave ?? ''" class="">
          <ShButton :disabled="!pathToSave" variant="outline" size="sm" class="w-full text-xs">
            <PlusIcon :size="12" /> Create
          </ShButton>
        </IconsMenuBookAdder>
      </SidebarGroup>

      <SidebarGroup v-for="[path, schema] in schemasArray" :key="path" class="py-0">
        <ShSidebarGroupContent>
          <FileTree :schema-path="path" :schema-name="schema.name" />
        </ShSidebarGroupContent>
      </SidebarGroup>
      <ShSidebarSeparator />
    </ShSidebarContent>

    <ShSidebarFooter>
      <ShDialog>
        <ShDialogContent>
          <SettingsPage />
        </ShDialogContent>
        <ShDialogTrigger>
          <ShSidebarMenuButton> <CogIcon /> Settings </ShSidebarMenuButton>
        </ShDialogTrigger>
      </ShDialog>
    </ShSidebarFooter>
  </ShSidebar>
</template>

<script setup lang="ts">
import { CogIcon, PlusIcon } from 'lucide-vue-next';
import path from 'path-browserify';
import { useTabsStore } from '~/composables/stores/useTabsStore';
import type { Schema } from '~/types';
import SidebarGroup from '../_shadcn/sidebar/SidebarGroup.vue';

const { data: schemas, error } = useUsableSchemas();

const tabsStore = useTabsStore();

const pathToSave = computed(() => {
  if (!tabsStore.openedItem) return null;
  if (tabsStore.openedItem.type === 'file') return path.basename(tabsStore.openedItem.id);

  if (tabsStore.openedItem.type === 'folder') return tabsStore.openedItem.thing;

  return null;
});

const schemasArray = computed(() => {
  return Object.entries(schemas.value || {}) as [string, Schema][];
});
</script>
