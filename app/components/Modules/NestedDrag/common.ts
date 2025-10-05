import { computed, inject, provide, ref, shallowRef } from 'vue';

export interface ItemInfoCore {
  parentIds: string[];
  id: string;
}

export interface DraggableInfo extends ItemInfoCore {
  // Undefined is type="default"
  type?: string;
}

export const DEFAULT_DRAGGABLE_TYPE = 'default';

export interface DropTargetInfo extends ItemInfoCore {
  // Undefined means any type is accepted
  acceptedTypes?: string[];
}

export type TargetPositionData = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type RegisteredTarget = {
  info: DropTargetInfo;
  position: TargetPositionData;
  /* Extra precaution to avoid conflicts when unregistering and immediately registering the same target */
  regKey: string;
};

export const useProvideDNDContext = ({
  onMove,
  emptyDivForScrollCompensation,
}: {
  onMove: (
    draggedItem: DraggableInfo,
    hoveredItem: DropTargetInfo,
    quadrant: PointQuadrant,
  ) => void;
  emptyDivForScrollCompensation?: Ref<HTMLElement | null>;
}) => {
  /** Scroll compensation. This is hard case where we can have another scroll container on page */
  const scrollCompensation = ref({
    leftStart: 0,
    topStart: 0,
    leftCurrent: 0,
    topCurrent: 0,
  });

  const compensateForScroll = computed(() => {
    return {
      x: scrollCompensation.value.leftCurrent - scrollCompensation.value.leftStart,
      y: scrollCompensation.value.topCurrent - scrollCompensation.value.topStart,
    };
  });

  const scrollAnywhere = () => {
    if (!emptyDivForScrollCompensation?.value) return;

    const rect = emptyDivForScrollCompensation.value.getBoundingClientRect();
    scrollCompensation.value.leftCurrent = rect.left;
    scrollCompensation.value.topCurrent = rect.top;
  };

  const startScrollCompensation = () => {
    if (!emptyDivForScrollCompensation?.value) return;
    const rect = emptyDivForScrollCompensation.value.getBoundingClientRect();
    scrollCompensation.value.leftStart = rect.left;
    scrollCompensation.value.topStart = rect.top;
    scrollCompensation.value.leftCurrent = rect.left;
    scrollCompensation.value.topCurrent = rect.top;
    document.addEventListener('scroll', scrollAnywhere, { capture: true });
  };

  const stopScrollCompensation = () => {
    document.removeEventListener('scroll', scrollAnywhere, { capture: true });
  };

  /** Dragged item */
  const draggedItem = ref<DraggableInfo | null>(null);

  const cursorPosition = ref({
    x: 0,
    y: 0,
  });

  const moveDrag = (e: PointerEvent) => {
    e.preventDefault();

    cursorPosition.value.x = e.clientX;
    cursorPosition.value.y = e.clientY;
  };

  const startDrag = (e: PointerEvent, item: DraggableInfo, t: HTMLElement) => {
    t.setPointerCapture(e.pointerId);

    draggedItem.value = item;

    cursorPosition.value.x = e.clientX;
    cursorPosition.value.y = e.clientY;

    document.addEventListener('pointermove', moveDrag);
    document.addEventListener('pointerup', finishDrag, { once: true });
    document.addEventListener('pointercancel', finishDrag, { once: true });
    document.addEventListener('lostpointercapture', finishDrag, { once: true });
    startScrollCompensation();
  };

  /** Target Registration */

  const dropTargets = shallowRef<Record<string, RegisteredTarget>>({});

  const registerDropTarget = (id: string, info: DropTargetInfo) => {
    const k = generateUniqId();
    dropTargets.value[id] = { info, position: { left: 0, top: 0, width: 0, height: 0 }, regKey: k };
    return k;
  };

  provide('pID', []);

  const updateDropTargetPositon = (id: string, regKey: string, position: TargetPositionData) => {
    if (dropTargets.value[id]?.regKey === regKey) {
      dropTargets.value[id].position = position;
    } else {
      console.error('updateDropTargetPositon: Drop target reg key mismatch', id, regKey);
    }
  };

  const updateDropTargetInfo = (id: string, regKey: string, info: DropTargetInfo) => {
    if (dropTargets.value[id]?.regKey === regKey) {
      dropTargets.value[id].info = info;
    } else {
      console.error('updateDropTargetInfo: Drop target reg key mismatch', id, regKey);
    }
  };

  const unregisterDropTarget = (id: string, regKey: string) => {
    if (dropTargets.value[id]?.regKey === regKey) {
      delete dropTargets.value[id];
    }
  };

  /** Collision detection */

  const relevantTargets = computed(() => {
    const targets: string[] = [];
    if (!draggedItem.value) return targets;

    for (const k of Object.keys(dropTargets.value)) {
      const t = dropTargets.value[k];
      if (!t) continue;

      if (t.info.parentIds.includes(draggedItem.value.id)) continue;

      if (
        t.info.acceptedTypes &&
        !t.info.acceptedTypes.includes(draggedItem.value.type ?? DEFAULT_DRAGGABLE_TYPE)
      )
        continue;

      targets.push(k);
    }

    return targets;
  });

  const hoveredId = computed(() => {
    if (!draggedItem.value) return null;

    let smallestRect: { id: string; size: number; quadrant: PointQuadrant } | null = null;

    for (const id of relevantTargets.value) {
      const rect = dropTargets.value[id]?.position;
      if (!rect) continue;

      const quadrant = checkPointInsideRect(rect, {
        x: cursorPosition.value.x,
        y: cursorPosition.value.y,
      });

      if (quadrant) {
        if (!smallestRect || rect.width * rect.height < smallestRect.size) {
          smallestRect = { id, size: rect.width * rect.height, quadrant };
        }
      }
    }

    return smallestRect ?? null;
  });

  /** Finish drag */

  const finishDrag = () => {
    try {
      if (hoveredId.value && draggedItem.value && hoveredId.value.id !== draggedItem.value.id) {
        const t = dropTargets.value[hoveredId.value.id];
        if (!t) {
          throw new Error('Drop target not found ' + hoveredId.value.id);
        }
        onMove(draggedItem.value, t.info, hoveredId.value.quadrant);
      }
    } catch (e) {
      console.error('finishDrag', e);
    }

    draggedItem.value = null;
    document.removeEventListener('pointermove', moveDrag);
    stopScrollCompensation();
  };

  const ctx = {
    draggedItem,
    startDrag,
    registerDropTarget,
    unregisterDropTarget,
    dropTargets,
    hoveredItem: hoveredId,
    updateDropTargetPositon,
    updateDropTargetInfo,
    cursorPosition,
    compensateForScroll,
  };

  provide('dndContext', ctx);

  return ctx;
};

export type DNDContext = ReturnType<typeof useProvideDNDContext>;

export const useCoolDndContext = () => {
  const dndContext = inject<DNDContext>('dndContext');
  if (!dndContext) {
    throw new Error('DND context is not provided');
  }

  return dndContext;
};

export type PointQuadrant = { y: 'top' | 'bottom'; x: 'left' | 'right' };

export const checkPointInsideRect = (
  rect: TargetPositionData,
  point: { x: number; y: number },
  padding: number = 0,
): PointQuadrant | null => {
  const rectWithPadding = {
    left: rect.left - padding,
    top: rect.top - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  const { left, top, width, height } = rectWithPadding;
  const { x, y } = point;

  const isInside = x >= left && x <= left + width && y >= top && y <= top + height;

  if (!isInside) {
    return null;
  }

  const midX = left + width / 2;
  const midY = top + height / 2;

  if (x < midX) {
    return y < midY ? { y: 'top', x: 'left' } : { y: 'bottom', x: 'left' };
  } else {
    return y < midY ? { y: 'top', x: 'right' } : { y: 'bottom', x: 'right' };
  }
};
