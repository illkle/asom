<template>
  <TreeItem
    v-bind="item.bind"
    v-slot="{ isExpanded, isSelected, handleToggle, handleSelect }"
    @select.prevent="
      (e) => {
        isCreatingFolder = true;
      }
    "
    @toggle.prevent
  >
    <ContextMenu :modal="true">
      <ContextMenuTrigger class="w-full">
        <div :style="`padding-left: ${item.level - 1}rem`" class="flex items-center w-full">
          <template v-if="isRenaming">
            <Input
              ref="inputRefRename"
              v-model="nameValue"
              @keydown.stop
              @keyup.stop
              @blur="renameFolder"
              @keyup.enter="renameFolder"
            />
          </template>
          <template v-else>
            <Button
              v-if="hasChildren"
              :variant="isSelected ? 'default' : 'ghost'"
              size="sm"
              class="w-6.5 rounded-r-none duration-0"
              @click="handleToggle"
            >
              <ChevronDown :size="12" :class="[!isExpanded && '-rotate-90']" />
            </Button>
            <Button
              :variant="isSelected ? 'default' : 'ghost'"
              size="sm"
              class="flex-1 w-full text-left justify-start duration-0"
              :class="hasChildren && 'rounded-l-none pl-1.5'"
              @click="ts.openNewThingFast({ _type: 'folder', _path: item.value.rawPath }, 'here')"
              @click.alt.exact="
                ts.openNewThingFast({ _type: 'folder', _path: item.value.rawPath }, 'last')
              "
              @click.middle.exact="
                ts.openNewThingFast({ _type: 'folder', _path: item.value.rawPath }, 'last')
              "
            >
              <FolderIcon v-if="!hasChildren" :size="12" />

              <div class="overflow-hidden text-ellipsis whitespace-nowrap">
                {{ item.value.name }}
              </div>
            </Button>
          </template>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem @click="startRenaming"> Remame </ContextMenuItem>
        <ContextMenuItem @click="startCreating"> Create Folder </ContextMenuItem>

        <ContextMenuItem
          @click="async () => await openPath(await path.join(rootPath, item.value.rawPath))"
        >
          Show in {{ fileManagerName }}
        </ContextMenuItem>

        <ContextMenuItem
          @click="
            async () => {
              await c_delete_to_trash(item.value.rawPath);
            }
          "
        >
          Delete Folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
    <div
      v-if="isCreating"
      :style="`padding-left: ${item.level + 1 - 1}rem`"
      class="flex items-center w-full gap-2"
    >
      <Input
        ref="inputRefCreate"
        v-model="nameValue"
        @keydown.stop
        @keyup.stop
        @keyup.enter="createFolder"
        @blur="
          () => {
            isCreating = false;
          }
        "
      />
      <Button variant="ghost" size="sm" @click="createFolder"> <PlusIcon /> </Button>
    </div>
  </TreeItem>
</template>

<script setup lang="ts">
import { openPath } from '@tauri-apps/plugin-opener';
import { ChevronDown, FolderIcon, PlusIcon } from 'lucide-vue-next';
import { TreeItem, type FlattenedItem } from 'reka-ui';

import { Button } from '~/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/ui/context-menu';

import { mkdir, rename } from '@tauri-apps/plugin-fs';

import { path } from '@tauri-apps/api';
import { c_delete_to_trash } from '~/api/tauriActions';
import type { FolderNode } from '~/components/FileTree/filePathsToTree';
import { useRootPathInjectSafe } from '~/composables/data/providers';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';

const props = defineProps<{
  item: FlattenedItem<FolderNode>;
}>();

const rootPath = useRootPathInjectSafe();

const isCreatingFolder = ref(false);
const newFolderName = ref('');

const inputRef = useTemplateRef<{ inputRef?: HTMLInputElement }>('inputRef');

watchEffect(() => {
  if (inputRef.value && inputRef.value.inputRef) {
    inputRef.value.inputRef.focus();
  }
});

const ts = useTabsStoreV2();

const hasChildren = computed(() => props.item.value.children.length > 0);

const isRenaming = ref(false);
const isCreating = ref(false);

const focusLock = ref(false);

const startRenaming = async () => {
  if (isRenaming.value) return;

  nameValue.value = props.item.value.name;

  // TODO: this sucks, but we seem to lose focus on input on context menu close? not sure how to prevent it otherwise
  setTimeout(() => {
    isRenaming.value = true;
  }, 100);
};

const startCreating = async () => {
  if (isCreating.value) return;

  nameValue.value = '';
  setTimeout(() => {
    isCreating.value = true;
  }, 100);
};

const nameValue = ref(props.item.value.name);

const renameFolder = async () => {
  const newName = nameValue.value;

  if (newName && newName !== props.item.value.name) {
    const oldPath = props.item.value.rawPath;
    const onlyDir = await path.dirname(oldPath);
    const newPath = await path.join(onlyDir, newName);
    await rename(oldPath, newPath);

    ts._handlePathRename(oldPath, newPath);
  }

  isRenaming.value = false;
};

const createFolder = async () => {
  if (!isCreating.value) return;
  const newPath = await path.join(props.item.value.rawPath, nameValue.value);
  await mkdir(newPath);

  isCreating.value = false;
};

useAppearingInputFocuser('inputRefRename');

useAppearingInputFocuser('inputRefCreate');

const fileManagerName = useFileManagerName();
</script>
