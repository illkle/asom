<template>
  <ContextMenu>
    <ContextMenuTrigger
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
    </ContextMenuTrigger>

    <ContextMenuContent>
      <ContextMenuItem @click="openFullEditor({ place: 'last', focus: true })">
        Open in a new tab
      </ContextMenuItem>

      <ContextMenuItem @click="deleteBook"> Delete </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
  <Teleport to="#customTeleport" v-if="isDragging">
    <div ref="forDrag" class="">
      <UiExtraDragDisplay>Dragging file</UiExtraDragDisplay>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { remove } from '@tauri-apps/plugin-fs';
import { useTabsStore, type OpenNewOneParams } from '~/composables/stores/useTabsStore';
export type IBookStyle = 'CARDS' | 'LINES';

const ts = useTabsStore();

const props = defineProps({
  path: {
    type: String,
    required: true,
  },
});

const openFullEditor = (params: OpenNewOneParams) => {
  ts.openNewOne(
    {
      id: ts.generateRandomId(),
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

  if (!ts.openedTabs) return;
  const toUpdateIndexes = ts.openedTabs.reduce((acc: number[], opened, index) => {
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
