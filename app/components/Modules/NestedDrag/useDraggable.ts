import { useCoolDndContext, type DraggableInfo } from '~/components/Modules/NestedDrag/common';

export type DraggableProps = {
  id: DraggableInfo['id'];
  type: DraggableInfo['type'];
  parentIds: DraggableInfo['parentIds'];
  disabled?: boolean;
};

export const useDraggable = (props: DraggableProps, constraintsRef: Ref<HTMLDivElement | null>) => {
  const { startDrag, draggedItem, cursorPosition, compensateForScroll } = useCoolDndContext<
    unknown,
    DraggableInfo
  >();

  const isDraggingMe = computed(() => {
    return draggedItem.value?.id === props.id;
  });

  const pos = ref({
    cursorStartX: 0,
    cursorStartY: 0,
  });

  const offset = computed(() => {
    if (!isDraggingMe.value) {
      return {
        x: 0,
        y: 0,
      };
    }

    return {
      x: cursorPosition.value.x - pos.value.cursorStartX - compensateForScroll.value.x,
      y: cursorPosition.value.y - pos.value.cursorStartY - compensateForScroll.value.y,
    };
  });

  const pointerDown = (e: PointerEvent) => {
    if (!constraintsRef.value) return;
    e.preventDefault();

    pos.value.cursorStartX = e.clientX;
    pos.value.cursorStartY = e.clientY;

    startDrag(
      e,
      { id: props.id, type: props.type, parentIds: props.parentIds },
      constraintsRef.value,
    );

    document.addEventListener('pointerup', pointerUp, { once: true });
  };

  const pointerUp = () => {
    pos.value = {
      cursorStartX: 0,
      cursorStartY: 0,
    };
  };

  return {
    isDraggingMe,
    offset,
    pointerDown,
  };
};
