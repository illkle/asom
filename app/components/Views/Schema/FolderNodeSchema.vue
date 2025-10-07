<template>
  <TreeItem v-bind="item.bind" v-slot="{ isExpanded }" @click="isCreatingFolder = true">
    <ContextMenu :modal="false">
      <ContextMenuTrigger class="w-full">
        <div :style="`padding-left: ${item.level - 1}rem`" class="flex items-center">
          <div
            variant="outline"
            size="none"
            class="flex flex-1 flex-col justify-start"
            :class="cn('', !item.value.hasSchema && 'opacity-50')"
          >
            <div
              class="flex items-center gap-2 w-full px-2 py-1.5 rounded-md border bg-transparent shadow-xs dark:bg-input/30 dark:border-input text-sm"
              :class="{ 'rounded-b-none': item.value.ownSchema }"
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

                Schema Owner
              </div>
            </div>
            <div v-if="item.value.ownSchema" class="w-full flex">
              <Button
                variant="outline"
                size="sm"
                class="grow rounded-t-none rounded-r-none border-t-0 border-r-0"
                @click="
                  tabsStore.openNewThingFast(
                    { _type: 'settings/schema', _path: item.value.rawPath },
                    'here',
                  )
                "
              >
                Schema
              </Button>

              <Button
                variant="outline"
                size="sm"
                class="grow rounded-none border-t-0"
                @click="
                  tabsStore.openNewThingFast(
                    { _type: 'settings/layout', _path: item.value.rawPath },
                    'here',
                  )
                "
              >
                Layout
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="grow border-l-0 rounded-l-none border-t-0 rounded-t-none"
                @click="
                  tabsStore.openNewThingFast(
                    { _type: 'settings/api', _path: item.value.rawPath },
                    'here',
                  )
                "
              >
                API
              </Button>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          v-if="item.value.hasSchema && item.value.schemaFilePath"
          @click="$emit('editSchema', item.value.schemaFilePath)"
        >
          Edit Schema
        </ContextMenuItem>
        <ContextMenuItem
          v-if="!item.value.ownSchema"
          @click="$emit('addNewSchema', item.value.name, item.value.rawPath)"
        >
          Create Schema
        </ContextMenuItem>

        <ContextMenuSub>
          <ContextMenuSubTrigger>Create From Template </ContextMenuSubTrigger>
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
              await c_delete_to_trash(await path.join(item.value.rawPath, '.asom', 'schema.yaml'))
          "
        >
          Delete Schema
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem @click="() => emit('createFolder', item.value.rawPath)">
          Create Folder
        </ContextMenuItem>

        <ContextMenuItem @click="async () => await c_delete_to_trash(item.value.rawPath)">
          Delete Folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  </TreeItem>
</template>

<script setup lang="ts">
import { path } from '@tauri-apps/api';
import { ChevronDown, FileIcon, FolderIcon } from 'lucide-vue-next';
import { TreeItem, type FlattenedItem } from 'reka-ui';

import { c_delete_to_trash } from '~/api/tauriActions';
import type { FolderNode } from '~/components/FileTree/filePathsToTree';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';

const isContextMenuOpen = ref(false);

const props = defineProps<{
  item: FlattenedItem<FolderNode>;
}>();

const tabsStore = useTabsStoreV2();

const emit = defineEmits<{
  (e: 'editSchema', path: string): void;
  (e: 'addNewSchema', name: string, path: string): void;
  (e: 'createFolder', path: string): void;
}>();

const isCreatingFolder = ref(false);

const createFromTemplate = async (schema: DefaultSchemaPack) => {
  await createDefaultSchema(schema, props.item.value.rawPath);
};
</script>
