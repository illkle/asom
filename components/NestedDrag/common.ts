import type { ShallowRef } from 'vue';

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

type StarterDragInfo = {
  mouseX: number;
  mouseY: number;
  elX: number;
  elY: number;
  width: number;
  height: number;
};

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

export type DNDContext = {
  draggedItem: Ref<DraggableInfo | null>;
  hoveredId: Ref<string | null>;

  dropTargets: ShallowRef<Record<string, RegisteredTarget>>;

  startDrag: (e: PointerEvent, item: DraggableInfo, t: HTMLElement) => void;

  registerDropTarget: (id: string, info: DraggableInfo) => string;
  updateDropTargetPositon: (id: string, regKey: string, position: TargetPositionData) => void;
  updateDropTargetInfo: (id: string, regKey: string, info: DropTargetInfo) => void;
  unregisterDropTarget: (id: string, regKey: string) => void;
};

export const useProvideDNDContext = ({
  onMove,
}: {
  onMove: (draggedItem: DraggableInfo, hoveredItem: DropTargetInfo) => void;
}): DNDContext => {
  const draggedItem = ref<DraggableInfo | null>(null);
  const dropTargets = shallowRef<Record<string, RegisteredTarget>>({});

  const registerDropTarget: DNDContext['registerDropTarget'] = (id, info) => {
    const k = generateUniqId();
    dropTargets.value[id] = { info, position: { left: 0, top: 0, width: 0, height: 0 }, regKey: k };
    return k;
  };

  provide('pID', []);

  const updateDropTargetPositon: DNDContext['updateDropTargetPositon'] = (id, regKey, position) => {
    if (dropTargets.value[id]?.regKey === regKey) {
      dropTargets.value[id].position = position;
    } else {
      console.error('updateDropTargetPositon: Drop target reg key mismatch', id, regKey);
    }
  };

  const updateDropTargetInfo: DNDContext['updateDropTargetInfo'] = (id, regKey, info) => {
    if (dropTargets.value[id]?.regKey === regKey) {
      dropTargets.value[id].info = info;
    } else {
      console.error('updateDropTargetInfo: Drop target reg key mismatch', id, regKey);
    }
  };

  const unregisterDropTarget: DNDContext['unregisterDropTarget'] = (id, regKey) => {
    if (dropTargets.value[id]?.regKey === regKey) {
      delete dropTargets.value[id];
    }
  };

  const starterDragInfo = ref<StarterDragInfo>({
    mouseX: 0,
    mouseY: 0,
    elX: 0,
    elY: 0,
    width: 0,
    height: 0,
  });

  const cursorPosition = ref({
    x: 0,
    y: 0,
  });

  const relevantTargets = computed(() => {
    const targets: string[] = [];
    if (!draggedItem.value) return targets;

    for (const k of Object.keys(dropTargets.value)) {
      const t = dropTargets.value[k];

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

    let smallestRect: { id: string; size: number } | null = null;

    for (const id of relevantTargets.value) {
      const rect = dropTargets.value[id].position;

      const isInside = checkPointInsideRect(rect, {
        x: cursorPosition.value.x,
        y: cursorPosition.value.y,
      });

      if (isInside) {
        if (!smallestRect || rect.width * rect.height < smallestRect.size) {
          smallestRect = { id, size: rect.width * rect.height };
        }
      }
    }

    return smallestRect?.id ?? null;
  });

  const moveDrag = (e: PointerEvent) => {
    // To prevent selection. It can be achieved by doing prevent on pointerdown too, but that conflicts with motion's drag
    e.preventDefault();

    cursorPosition.value = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  const startDrag: DNDContext['startDrag'] = (e, item, t) => {
    console.log('startDrag', e, item, t);
    if (t instanceof HTMLElement) {
      const { x, y, width, height } = t.getBoundingClientRect();

      starterDragInfo.value = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        width,
        height,
        elX: x,
        elY: y,
      };

      t.setPointerCapture(e.pointerId);
    } else {
      console.error('target is not an HTMLElement', t);
      return;
    }

    draggedItem.value = item;

    document.addEventListener('pointermove', moveDrag);
    document.addEventListener('pointerup', finishDrag, { once: true });
    document.addEventListener('pointercancel', finishDrag, { once: true });
    document.addEventListener('lostpointercapture', finishDrag, { once: true });
  };

  const finishDrag = () => {
    try {
      if (hoveredId.value && draggedItem.value && hoveredId.value !== draggedItem.value.id) {
        onMove(draggedItem.value, dropTargets.value[hoveredId.value].info);
      }
    } catch (e) {
      console.error('finishDrag', e);
    }

    draggedItem.value = null;
    document.removeEventListener('pointermove', moveDrag);
  };

  const ctx = {
    draggedItem,
    startDrag,
    registerDropTarget,
    unregisterDropTarget,
    dropTargets,
    hoveredId,
    updateDropTargetPositon,
    updateDropTargetInfo,
  } satisfies DNDContext;

  provide('dndContext', ctx);

  return ctx;
};

export const useCoolDndContext = <ItemShape, TargetShape>() => {
  const dndContext = inject<DNDContext>('dndContext');
  if (!dndContext) {
    throw new Error('DND context is not provided');
  }

  return dndContext;
};

export const getCenterFromStarterInfo = (
  starterInfo: StarterDragInfo,
  mouseX: number,
  mouseY: number,
): { x: number; y: number } => {
  const { elX, elY, width, height } = starterInfo;
  const dx = mouseX - starterInfo.mouseX;
  const dy = mouseY - starterInfo.mouseY;
  return {
    x: elX + width / 2 + dx,
    y: elY + height / 2 + dy,
  };
};

export const checkPointInsideRect = (
  rect: TargetPositionData,
  point: { x: number; y: number },
): boolean => {
  const { left, top, width, height } = rect;
  const { x, y } = point;

  const isInside = x >= left && x <= left + width && y >= top && y <= top + height;

  return isInside;
};
