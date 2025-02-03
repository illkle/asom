<template>
  <ShSidebar :class="$props.class" variant="floating" collapsible="icon">
    <ShSidebarContent>
      <SidebarGroup v-for="schema in schemas" :key="schema.internal_name" class="py-0">
        <ShSidebarGroupLabel>
          {{ schema.name }}
        </ShSidebarGroupLabel>
        <ShSidebarGroupContent>
          <FileTree :schema-path="schema.internal_path" :schema-name="schema.name" />
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
import type { Schema } from '~/types';
import SidebarGroup from '../_shadcn/sidebar/SidebarGroup.vue';
import { CogIcon } from 'lucide-vue-next';

const { data: schemas, error } = useUsableSchemas();

const currentSchema = ref<Schema | null>(null);

watch(error, (err) => {
  if (err) {
    navigateTo('/schemas');
  }
});

watch(schemas, (schemas) => {
  if (schemas && schemas.length) {
    currentSchema.value = schemas[0];
    return;
  }
});
</script>
