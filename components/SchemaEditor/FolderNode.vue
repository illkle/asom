<script setup lang="ts">
import { ChevronDown, FileIcon, FolderIcon } from 'lucide-vue-next';
import path from 'path-browserify';
import { TreeItem, type FlattenedItem } from 'reka-ui';

import { remove } from '@tauri-apps/plugin-fs';
import type { FolderNode } from '~/components/FileTree/filePathsToTree';

const props = defineProps<{
  item: FlattenedItem<FolderNode>;
}>();

const router = useRouter();

const openSchemaEditor = (path: string) => {
  router.push(`/schemas/edit?path=${path}`);
};

const isCreatingFolder = ref(false);
const newFolderName = ref('');

const inputRef = useTemplateRef<{ inputRef?: HTMLInputElement }>('inputRef');

watchEffect(() => {
  if (inputRef.value && inputRef.value.inputRef) {
    inputRef.value.inputRef.focus();
  }
});
</script>

<template>
  <TreeItem v-bind="item.bind" v-slot="{ isExpanded }" @click="isCreatingFolder = true">
    <ShContextMenu :modal="false">
      <ShContextMenuTrigger class="w-full">
        <div :style="`padding-left: ${item.level - 1}rem`" class="flex items-center gap-2">
          <ShButton
            variant="outline"
            size="xs"
            class="flex w-full justify-start gap-2"
            :class="cn(!item.value.hasSchema && 'opacity-50')"
          >
            <ChevronDown
              v-if="item.value.children.length > 0"
              :size="12"
              :class="[!isExpanded && '-rotate-90']"
            />
            <FolderIcon v-else :size="12" />

            {{ item.value.name }}

            <div
              v-if="item.value.ownSchema"
              class="ml-auto flex items-center gap-2 text-xs opacity-80"
            >
              <FileIcon :size="12" />

              Schema owner
            </div>
          </ShButton>
          <div v-if="item.value.ownSchema" class="ml-auto flex items-center gap-2 text-xs">
            <ShButton
              v-if="item.value.schemaFilePath"
              variant="outline"
              size="xs"
              @click.stop="openSchemaEditor(item.value.schemaFilePath)"
              >Edit</ShButton
            >
          </div>
        </div>
      </ShContextMenuTrigger>
      <ShContextMenuContent>
        <ShContextMenuItem
          v-if="item.value.hasSchema && item.value.schemaFilePath"
          @click="openSchemaEditor(item.value.schemaFilePath)"
        >
          Edit schema
        </ShContextMenuItem>
        <ShContextMenuItem
          v-if="!item.value.ownSchema"
          @click="$emit('addNewSchema', item.value.name, item.value.rawPath)"
        >
          Create schema
        </ShContextMenuItem>
        <ShContextMenuItem
          v-if="item.value.ownSchema"
          @click="
            async () =>
              await remove(path.join(item.value.rawPath, 'schema.yaml'), { recursive: true })
          "
        >
          Delete schema
        </ShContextMenuItem>

        <ShContextMenuSeparator />

        <ShContextMenuItem @click="() => $emit('createFolder', item.value.rawPath)">
          Create Folder
        </ShContextMenuItem>

        <ShContextMenuItem
          @click="async () => await remove(item.value.rawPath, { recursive: true })"
        >
          Delete Folder
        </ShContextMenuItem>
      </ShContextMenuContent>
    </ShContextMenu>
  </TreeItem>
</template>
