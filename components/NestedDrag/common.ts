import { useMouse } from '@vueuse/core';

export type DraggedItemInfo = {
  location: string[];
  id: string;
  type?: string;
  userFlags?: Record<string, string>;
};

export type HoveredItemInfo = {
  group: string;
  index: number;
  priority: number;
  userFlags?: Record<string, string>;
};

type StarterDragInfo = {
  mouseX: number;
  mouseY: number;
  elX: number;
  elY: number;
  width: number;
  height: number;
};

export type DNDContext = {
  draggedItem: Ref<DraggedItemInfo | null>;
  hoveredId: Ref<string | null>;
  starterDragInfo: Ref<StarterDragInfo>;
  draggedRect: Ref<CornerPositionData>;

  startDrag: (e: PointerEvent, item: DraggedItemInfo, t: HTMLElement) => void;
  handleDragEnd: () => void;

  elementRepository: Ref<Record<string, ComputedRef<CornerPositionData>>>;
};

export const compareDraggedInfo = (a: DraggedItemInfo, b: DraggedItemInfo) => {
  return JSON.stringify(a) === JSON.stringify(b);
};

export const compareHoveredInfo = (a: HoveredItemInfo, b: HoveredItemInfo) => {
  return a.group === b.group && a.index === b.index;
};

export const useProvideDNDContext = ({
  onMove,
}: {
  onMove: (draggedItem: DraggedItemInfo, hoveredItem: HoveredItemInfo) => void;
}): DNDContext => {
  const draggedItem = ref<DraggedItemInfo | null>(null);
  const elementRepository = ref<Record<string, ComputedRef<CornerPositionData>>>({});

  const starterDragInfo = ref<StarterDragInfo>({
    mouseX: 0,
    mouseY: 0,
    elX: 0,
    elY: 0,
    width: 0,
    height: 0,
  });
  const mousePosition = useMouse();

  const draggedRect = computed(() => {
    return getCornerPositionDataFromStarterInfo(
      starterDragInfo.value,
      mousePosition.x.value,
      mousePosition.y.value,
    );
  });

  const hoveredId = computed(() => {
    if (!draggedItem.value) return null;

    console.log(Object.entries(elementRepository.value));

    const ids = Object.keys(elementRepository.value);

    let closestItem: { id: string; distance: number } | null = null;

    for (const id of ids) {
      const rect = elementRepository.value[id];
      const distance = calculateCornerDistanceSum(draggedRect.value, toValue(rect));

      if (!closestItem || distance < closestItem.distance) {
        closestItem = { id, distance };
      }
    }

    return closestItem?.id ?? null;
  });

  const startDrag: DNDContext['startDrag'] = (e, item, t) => {
    if (t instanceof HTMLElement) {
      const { x, y, width, height } = t.getBoundingClientRect();
      console.log(x, y, width, height);

      starterDragInfo.value = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        width,
        height,
        elX: x,
        elY: y,
      };
    } else {
      console.error('target is not an HTMLElement', t);
    }
    draggedItem.value = item;

    const prevent = (e: PointerEvent) => {
      e.preventDefault();
    };

    document.addEventListener('pointermove', prevent);

    document.addEventListener(
      'pointerup',
      () => {
        handleDragEnd();
        document.removeEventListener('pointermove', prevent);
      },
      { once: true },
    );
  };

  const handleDragEnd: DNDContext['handleDragEnd'] = () => {
    draggedItem.value = null;
  };

  const ctx = {
    draggedItem,
    starterDragInfo,
    startDrag,
    handleDragEnd,
    elementRepository,
    draggedRect,
    hoveredId,
  } satisfies DNDContext;

  provide('dndContext', ctx);

  return ctx;
};

export type CornerPositionData = {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
};

export const useCoolDndContext = <ItemShape, TargetShape>() => {
  const dndContext = inject<DNDContext>('dndContext');
  if (!dndContext) {
    throw new Error('DND context is not provided');
  }

  return dndContext;
};

const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const calculateCornerDistanceSum = (
  rect1: CornerPositionData,
  rect2: CornerPositionData,
): number => {
  const topLeftDistance = calculateDistance(rect1.topLeft, rect2.topLeft);
  const topRightDistance = calculateDistance(rect1.topRight, rect2.topRight);
  const bottomLeftDistance = calculateDistance(rect1.bottomLeft, rect2.bottomLeft);
  const bottomRightDistance = calculateDistance(rect1.bottomRight, rect2.bottomRight);

  return topLeftDistance + topRightDistance + bottomLeftDistance + bottomRightDistance;
};

export const getCornerPositionDataFromStarterInfo = (
  starterInfo: StarterDragInfo,
  mouseX: number,
  mouseY: number,
): CornerPositionData => {
  const { elX, elY, width, height, mouseX: initialMouseX, mouseY: initialMouseY } = starterInfo;

  const dx = mouseX - initialMouseX;
  const dy = mouseY - initialMouseY;

  return {
    topLeft: { x: elX + dx, y: elY + dy },
    topRight: { x: elX + width + dx, y: elY + dy },
    bottomLeft: { x: elX + dx, y: elY + height + dy },
    bottomRight: { x: elX + width + dx, y: elY + height + dy },
  };
};
