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

const emit = defineEmits<{
  (e: 'editSchema', path: string): void;
  (e: 'addNewSchema', name: string, path: string): void;
  (e: 'createFolder', path: string): void;
}>();

const isCreatingFolder = ref(false);
const newFolderName = ref('');

const createFromTemplate = async (schema: DefaultSchemaPack) => {
  await createDefaultSchema(schema, props.item.value.rawPath);
};
</script>

<template>
  <TreeItem v-bind="item.bind" v-slot="{ isExpanded }" @click="isCreatingFolder = true">
    <ContextMenu :modal="false">
      <ContextMenuTrigger class="w-full">
        <div :style="`padding-left: ${item.level - 1}rem`" class="flex items-center">
          <Button
            variant="outline"
            size="sm"
            class="flex flex-1 justify-start gap-2"
            :class="
              cn(
                !item.value.hasSchema && 'opacity-50',
                item.value.ownSchema && 'rounded-r-none border-r-0',
              )
            "
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
          </Button>
          <div v-if="item.value.ownSchema" class="ml-auto flex items-center gap-2 text-xs">
            <Button
              v-if="item.value.schemaFilePath"
              variant="outline"
              size="sm"
              class="rounded-l-none"
              @click.stop="$emit('editSchema', item.value.schemaFilePath)"
              >Edit</Button
            >
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          v-if="item.value.hasSchema && item.value.schemaFilePath"
          @click="$emit('editSchema', item.value.schemaFilePath)"
        >
          Edit schema
        </ContextMenuItem>
        <ContextMenuItem
          v-if="!item.value.ownSchema"
          @click="$emit('addNewSchema', item.value.name, item.value.rawPath)"
        >
          Create schema
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger>Create from template </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem
              v-for="schema in DefaultSchemaPacks"
              :key="schema.name"
              @click="createFromTemplate(schema)"
            >
              {{ schema.name }}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem
          v-if="item.value.ownSchema"
          @click="
            async () =>
              await remove(path.join(item.value.rawPath, '.asom', 'schema.yaml'), {
                recursive: true,
              })
          "
        >
          Delete schema
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem @click="() => $emit('createFolder', item.value.rawPath)">
          Create Folder
        </ContextMenuItem>

        <ContextMenuItem @click="async () => await remove(item.value.rawPath, { recursive: true })">
          Delete Folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  </TreeItem>
</template>
