<template>
  <ShContextMenu>
    <ShContextMenuTrigger
      v-bind="$attrs"
      class="cursor-pointer"
      :draggable="true"
      :class="$attrs.class"
      @click.exact="openFullEditor({ place: 'current', focus: true })"
      @click.alt="openFullEditor({ place: 'last' })"
      @click.middle.exact="openFullEditor({ place: 'last' })"
      @dragstart="startDrag"
      @dragend="() => (isDragging = false)"
    >
      <slot />
    </ShContextMenuTrigger>

    <ShContextMenuContent>
      <ShContextMenuItem @click="openFullEditor({ place: 'last', focus: true })">
        Open in a new tab
      </ShContextMenuItem>

      <ShContextMenuItem @click="deleteBook"> Delete </ShContextMenuItem>
    </ShContextMenuContent>
  </ShContextMenu>
  <Teleport to="#customTeleport" v-if="isDragging">
    <div ref="forDrag" class="">
      <UIDragDisplay>Dragging file</UIDragDisplay>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { debounce as _debounce } from 'lodash';

import { useStore } from '~~/utils/store';

import { remove } from '@tauri-apps/plugin-fs';
export type IBookStyle = 'CARDS' | 'LINES';

const store = useStore();

const props = defineProps({
  path: {
    type: String,
    required: true,
  },
});

const openFullEditor = (params: OpenNewOneParams) => {
  store.openNewOne(
    {
      id: store.generateRandomId(),
      type: 'file',
      thing: props.path,
      scrollPosition: 0,
    },
    params,
  );
};

const deleteBook = () => remove(props.path);

//
// Drag & drop
//
const forDrag = useTemplateRef('forDrag');

const isDragging = ref(false);
const startDrag = (devt: DragEvent) => {
  isDragging.value = true;

  if (devt.dataTransfer === null) {
    return;
  }

  devt.dataTransfer.setData('type', 'file');

  devt.dataTransfer.setData('itemPath', props.path);

  if (!store.openedTabs) return;
  const toUpdateIndexes = store.openedTabs.reduce((acc: number[], opened, index) => {
    if (opened.type === 'file' && opened.thing === props.path) {
      acc.push(index);
    }
    return acc;
  }, []);

  nextTick(() => {
    if (devt.dataTransfer === null || !forDrag.value) {
      return;
    }
    devt.dataTransfer.setDragImage(forDrag.value, 0, -10);
  });
  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));
};
</script>

<style scoped></style>
