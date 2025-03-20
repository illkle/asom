<template>
  <ShSidebar :class="$props.class" variant="floating" collapsible="icon">
    <ShSidebarContent class="py-3">
      <SidebarGroup v-for="[path, schema] in schemasArray" :key="path" class="py-0">
        <ShSidebarGroupContent>
          <FileTree :schema-path="path" :schema-name="schema.name" />
          <IconsMenuBookAdder :path-to-save="path">
            <ShButton variant="ghost" class="h-6 w-full text-xs opacity-50">
              <PlusIcon :size="12" /> Add to {{ schema.name }}
            </ShButton>
          </IconsMenuBookAdder>
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
import type { Schema } from '~/types';
import SidebarGroup from '../_shadcn/sidebar/SidebarGroup.vue';

const { data: schemas, error } = useUsableSchemas();

const schemasArray = computed(() => {
  return Object.entries(schemas.value || {}) as [string, Schema][];
});
</script>
