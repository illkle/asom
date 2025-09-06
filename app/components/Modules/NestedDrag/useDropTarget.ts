import {
  useCoolDndContext,
  type DraggableInfo,
  type DropTargetInfo,
} from '~/components/Modules/NestedDrag/common';

export type DropTargetProps = {
  id: DropTargetInfo['id'];
  parentIds?: DropTargetInfo['parentIds'];
  acceptedTypes?: DropTargetInfo['acceptedTypes'];
  disabled?: boolean;
};

export const useDropTarget = (props: DropTargetProps, el: Ref<HTMLDivElement | null>) => {
  const pID = inject<string[]>('pID');

  const parentIds = computed(() => props.parentIds ?? pID ?? []);

  provide('pID', [...parentIds.value, props.id]);

  const {
    draggedItem,
    hoveredItem,
    registerDropTarget,
    updateDropTargetPositon,
    unregisterDropTarget,
    updateDropTargetInfo,
  } = useCoolDndContext<unknown, DraggableInfo>();

  const isOver = computed(() => {
    return hasDraggedItem.value && hoveredItem.value?.id === props.id;
  });

  const hasDraggedItem = computed(() => {
    return draggedItem.value !== null;
  });

  const trackSizeChanges = ref(false);

  watch(hasDraggedItem, () => {
    if (hasDraggedItem.value) {
      trackSizeChanges.value = true;
      computeIfTracking();
    } else {
      trackSizeChanges.value = false;
    }
  });

  const backup = ref({ left: 0, top: 0, width: 0, height: 0 });

  const computeSizeData = () => {
    if (!el.value) return { left: 0, top: 0, width: 0, height: 0 };

    const rect = el.value.getBoundingClientRect();

    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  };

  const computeIfTracking = () => {
    if (trackSizeChanges.value) {
      const sd = computeSizeData();
      updateDropTargetPositon(props.id, regKey.value, sd);
      backup.value = sd;
    }
  };

  const regKey = ref('');

  const id = computed(() => props.id);

  watch(
    id,
    (current, prev) => {
      if (regKey.value && prev) {
        unregisterDropTarget(prev, regKey.value);
      }

      regKey.value = registerDropTarget(current, {
        id: current,
        parentIds: parentIds.value,
      });
    },
    { immediate: true },
  );

  watch(
    [parentIds],
    () => {
      updateDropTargetInfo(id.value, regKey.value, {
        id: id.value,
        parentIds: parentIds.value,
      });
    },
    { deep: true },
  );

  onMounted(() => {
    addEventListener('scroll', computeIfTracking, {
      capture: true,
    });
    addEventListener('resize', computeIfTracking);
  });

  onUnmounted(() => {
    removeEventListener('scroll', computeIfTracking, { capture: true });
    removeEventListener('resize', computeIfTracking);
    if (regKey.value) {
      unregisterDropTarget(props.id, regKey.value);
    }
  });

  return { isOver, hoveredItem };
};
