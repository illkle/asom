<template>
  <ShContextMenu v-if="!isRoot">
    <ShContextMenuTrigger>
      <TreeCell
        :draggable="!isRoot"
        :is-root="isRoot"
        :can-be-folded="foldable"
        :can-drop-here="dragCounter > 0"
        :name="isRoot ? `All ${rootName}` : content.name"
        :is-folded="isFolded"
        :selected="isOpened"
        :is-renaming="isRenaming"
        @dragstart="startDrag($event, content.rawPath)"
        @drop="onDrop($event, content.rawPath)"
        @dragenter="dragEnter"
        @dragleave="dragLeave"
        @dragover.prevent
        @click.exact="makeNewOpenedAndSelect({ place: 'current', focus: true })"
        @click.alt.exact="makeNewOpenedAndSelect({ place: 'last' })"
        @click.middle.exact="makeNewOpenedAndSelect({ place: 'last' })"
        @fold-click="
          () => {
            isFolded = !isFolded;
          }
        "
        @save-name="saveName"
      >
        <template #leftIcon>
          <ChevronDown
            v-if="foldable"
            :class="[isFolded && '-rotate-90']"
            @click.stop="
              () => {
                isFolded = !isFolded;
              }
            "
          />
          <FolderIcon v-else-if="!isRoot" class="" />
          <LibraryIcon v-else />
        </template>
      </TreeCell>
    </ShContextMenuTrigger>
    <ShContextMenuContent>
      <ShContextMenuItem @click="startCreating"> Create folder </ShContextMenuItem>
      <template v-if="!isRoot">
        <ShContextMenuItem @click="startRenaming"> Rename folder </ShContextMenuItem>

        <ShContextMenuItem @click="deleteFolder"> Delete folder </ShContextMenuItem>
      </template>
    </ShContextMenuContent>
  </ShContextMenu>

  <div v-if="!isFolded || isCreating" :class="(foldable || isCreating) && 'pl-5'">
    <FileTreeInner
      v-for="item in content.children"
      :key="item.path"
      :content="item"
      :depth="depth + 10"
    />
    <TreeCell v-if="isCreating" :name="''" :is-renaming="true" @save-name="saveNewFolder" />
  </div>
</template>

<script setup lang="ts">
import { computed, onUpdated, ref, watchEffect, nextTick } from 'vue';

import { cloneDeep as _cloneDeep } from 'lodash';
import { getDefaultViewSettings } from '~/utils/getDefaultViewSettings';
import type { PropType } from 'vue';
import { useMainStore } from '~/composables/stores/useMainStore';

import TreeCell from './TreeCell.vue';
import type { FolderNode } from './filePathsToTree';
import { once } from '@tauri-apps/api/event';
import { mkdir, remove, rename } from '@tauri-apps/plugin-fs';
import path from 'path-browserify';
import { FolderIcon, LibraryIcon, ChevronDown } from 'lucide-vue-next';

const store = useMainStore();

const props = defineProps({
  content: {
    type: Object as PropType<FolderNode>,
    required: true,
  },
  depth: {
    type: Number,
    default: -10,
  },
  rootName: {
    type: String,
    default: '',
  },
});

const isRoot = props.depth < 0;
const isFolded = ref(false);
const isOpened = ref(false);
// Used to prevent isOpened from going to false when renaming selected item
const renameLock = ref(false);

watchEffect(() => {
  if (renameLock.value) {
    return;
  }
  if (!store.openedItem) {
    isOpened.value = false;
    return;
  }

  isOpened.value =
    store.openedItem.type === 'folder' && store.openedItem.thing === props.content.rawPath;
});

const foldable = computed(() => props.content.children.length > 0 && !isRoot);

const makeNewOpenedAndSelect = (params: OpenNewOneParams) => {
  store.openNewOne(
    {
      id: store.generateRandomId(),
      type: 'folder',
      thing: props.content.rawPath,
      scrollPosition: 0,
      settings: getDefaultViewSettings(),
      recursive: isRoot,
    },
    params,
  );
};

///
/// Drag and drop
///

const dragCounter = ref(0);

const dragEnter = (e: DragEvent) => {
  e.preventDefault();
  dragCounter.value++;
  //canDropHere.value = true;
};

const dragLeave = (e: DragEvent) => {
  e.preventDefault();
  dragCounter.value--;
  //canDropHere.value = false;
};

const startDrag = (devt: DragEvent, path: string) => {
  if (devt.dataTransfer === null) {
    return;
  }
  devt.dataTransfer.setData('type', 'folder');

  devt.dataTransfer.setData('itemPath', path);

  if (!store.openedTabs) {
    return;
  }

  const toUpdateIndexes = store.openedTabs.reduce((acc: number[], opened, index) => {
    if (opened.type === 'folder' && opened.thing === path) {
      acc.push(index);
    }
    return acc;
  }, []);

  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));
};

const onDrop = async (e: DragEvent, targetPath: string) => {
  dragCounter.value = 0;

  const type = e.dataTransfer?.getData('type');

  if (type === 'folder' || type === 'file') {
    const draggedPath = e.dataTransfer?.getData('itemPath');
    const indexes: number[] = JSON.parse(e.dataTransfer?.getData('indexesToUpdate') || '[]');

    if (!draggedPath) {
      throw 'no dragged path';
    }
    const newPath = await moveToFolder({
      moveItemPath: draggedPath,
      toFolderPath: targetPath,
    });

    indexes.forEach((index) => {
      if (!store.openedTabs) return;
      const before = store.openedTabs[index];
      if (before.type === 'file' || before.type === 'folder') {
        store.openNewOne({ ...before, thing: newPath }, { place: 'replace', index });
      }
    });
  }
};

///
/// Renaming
///
const flipOnNext = ref(false);
onUpdated(() => {
  if (flipOnNext.value) {
    isRenaming.value = false;
    isCreating.value = false;
    flipOnNext.value = false;
  }
});

const isRenaming = ref(false);

const startRenaming = () => {
  isRenaming.value = true;
};

const saveName = async (newName: string) => {
  isRenaming.value = false;
  // Locks isOpened value
  renameLock.value = true;

  if (newName && newName !== props.content.name) {
    const oldPath = props.content.rawPath;

    const newPath = await renameEntity({
      newName: newName,
      srcPath: oldPath,
    });

    if (!store.openedTabs) return;

    store.openedTabs.forEach((item, index) => {
      if (item.type === 'folder' && item.thing === oldPath) {
        store.openNewOne({ ...item, thing: newPath }, { place: 'replace', index });
      }

      if (item.type === 'file' && item.thing.includes(oldPath)) {
        store.openNewOne(
          { ...item, thing: item.thing.replace(oldPath, newPath) },
          { place: 'replace', index },
        );
      }
    });
  }

  // Unlocks isOpened value when our fs watcher sends updated FileTree data
  once('folder_add', () => {
    renameLock.value = false;
  });
};

///
/// Creating new folder
///
const isCreating = ref(false);

const startCreating = () => {
  isCreating.value = true;
};

const saveNewFolder = async (name: string) => {
  if (!name) {
    isCreating.value = false;
  } else {
    const newPath = await path.join(props.content.rawPath, name);
    await mkdir(newPath);
    flipOnNext.value = true;
  }
};

const deleteFolder = async () => {
  await remove(props.content.rawPath, { recursive: true });
};

const renameEntity = async ({ srcPath, newName }: { srcPath: string; newName: string }) => {
  const onlyDir = await path.dirname(srcPath);
  const targetPath = await path.join(onlyDir, newName);
  await rename(srcPath, targetPath);
  return targetPath;
};

const moveToFolder = async ({
  moveItemPath,
  toFolderPath,
}: {
  moveItemPath: string;
  toFolderPath: string;
}): Promise<string> => {
  const target = await path.join(toFolderPath, await path.basename(moveItemPath));
  if (target === moveItemPath) return moveItemPath;
  await rename(moveItemPath, target);
  return target;
};
</script>

<style lang="postcss"></style>
