import { watchDebounced } from '@vueuse/core';
import { cloneDeep } from 'lodash-es';

export type DraggedItemInfo = {
  id: string;
  type?: string;
};

export type HoveredItemInfo = {
  group: string;
  index: number;
  priority: number;
};

export type DNDContext = {
  draggedItem: Ref<DraggedItemInfo | null>;
  hoveredItem: Ref<HoveredItemInfo | null>;
  starterPosition: Ref<{ x: number; y: number }>;
  offset: Ref<{ x: number; y: number }>;

  startDrag: (e: PointerEvent, item: DraggedItemInfo) => void;
  handleDragEnd: () => void;

  handleDragEnter: (item: HoveredItemInfo) => void;
  handleDragLeave: (item: HoveredItemInfo) => void;
};

export const compareDraggedInfo = (a: DraggedItemInfo, b: DraggedItemInfo) => {
  return a.id === b.id && a.type === b.type;
};

export const compareHoveredInfo = (a: HoveredItemInfo, b: HoveredItemInfo) => {
  return a.group === b.group && a.index === b.index;
};

export const useProvideDNDContext = <DataShape, ItemShape>({
  itemsRef,
  removeItemInPlace,
  insertItemInPlace,
}: {
  itemsRef: Ref<DataShape>;
  removeItemInPlace: (data: DataShape, item: DraggedItemInfo) => ItemShape;
  insertItemInPlace: (data: DataShape, item: HoveredItemInfo, target: ItemShape) => void;
  idFromItem: (item: ItemShape) => string;
}) => {
  const draggedItem = ref<DraggedItemInfo | null>(null);
  const hoveredItems = ref<HoveredItemInfo[]>([]);

  const hoveredItem = computed(() => {
    let i: HoveredItemInfo | null = null;

    for (const item of hoveredItems.value) {
      if (!i || item.priority > i.priority) {
        i = item;
      }
    }

    return i;
  });

  const v = ref(itemsRef.value);

  watchDebounced(
    hoveredItem,
    () => {
      v.value = virtual.value;
    },
    {
      debounce: 300,
    },
  );

  const virtual = computed(() => {
    const clone = cloneDeep(itemsRef.value);
    if (!draggedItem.value) {
      return clone;
    }

    const item = removeItemInPlace(clone, draggedItem.value);

    if (hoveredItem.value) {
      insertItemInPlace(clone, hoveredItem.value, item);
      return clone;
    }

    return itemsRef.value;
  });

  const starterPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });
  const offset = ref<{ x: number; y: number }>({ x: 0, y: 0 });

  const moveHandler = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    offset.value.x = e.clientX - starterPosition.value.x;
    offset.value.y = e.clientY - starterPosition.value.y;
  };

  const startDrag: DNDContext['startDrag'] = (e, item) => {
    e.preventDefault();
    draggedItem.value = item;
    starterPosition.value = { x: e.clientX, y: e.clientY };
    document.addEventListener('pointermove', moveHandler);
    document.addEventListener(
      'pointerup',
      () => {
        handleDragEnd();
        document.removeEventListener('pointermove', moveHandler);
      },
      { once: true },
    );
  };

  const handleDragEnd: DNDContext['handleDragEnd'] = () => {
    if (draggedItem.value && hoveredItem.value) {
      itemsRef.value = virtual.value;
    }
    draggedItem.value = null;
    hoveredItems.value = [];
    offset.value.x = 0;
    offset.value.y = 0;
    starterPosition.value.x = 0;
    starterPosition.value.y = 0;
  };

  const handleDragEnter: DNDContext['handleDragEnter'] = (item) => {
    console.log('handleDragEnter', item, hoveredItems.value.length);
    hoveredItems.value.push({ ...item });
  };

  const handleDragLeave: DNDContext['handleDragLeave'] = (item) => {
    console.log('handleDragLeave', item.index);
    hoveredItems.value = hoveredItems.value.filter((i) => !compareHoveredInfo(i, item));
  };

  provide('dndContext', {
    draggedItem,
    hoveredItem,
    starterPosition,
    offset,
    startDrag,
    handleDragEnd,
    handleDragEnter,
    handleDragLeave,
  } satisfies DNDContext);

  return {
    virtual: v,
    draggedItem,
    hoveredItem,
    starterPosition,
    offset,
  };
};

export const useCoolDndContext = <ItemShape, TargetShape>() => {
  const dndContext = inject<DNDContext>('dndContext');
  if (!dndContext) {
    throw new Error('DND context is not provided');
  }

  return dndContext;
};
