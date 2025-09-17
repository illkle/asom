const provideName = 'keyboardListManager';

type ItemHandlers = {
  // Handler returns whether we continue with default handler or stop execution
  onLeft?: (e: KeyboardEvent) => boolean;
  onRight?: (e: KeyboardEvent) => boolean;
  onUp?: (e: KeyboardEvent) => boolean;
  onDown?: (e: KeyboardEvent) => boolean;
  onSelect?: () => void;
};

export const useKeyboardListManager = (wrapperRef: Ref<HTMLElement | null>) => {
  const items = ref<Record<string, ItemHandlers>>({});

  const listContextId = useId();

  const registerItem = (itemID: string, handlers: ItemHandlers, isDefault: boolean = false) => {
    if (isDefault) {
      defaultItemId.value = itemID;
    }
    items.value[itemID] = handlers;
  };

  const unregisterItem = (itemID: string) => {
    if (selectedItem.value?.id === itemID) {
      selectedItem.value = null;
    }

    delete items.value[itemID];
  };

  const selectedItem = ref<{
    id: string;
    index: number;
    handlers: ItemHandlers;
  } | null>(null);

  const defaultItemId = ref<string | null>(null);

  const selectedItemId = computed(() => {
    return selectedItem.value?.id ?? defaultItemId.value;
  });

  const selectMove = (direction: 'up' | 'down') => {
    if (!wrapperRef.value) {
      console.warn('wrapperRef not found', wrapperRef.value, wrapperRef);
      return;
    }

    const q = wrapperRef.value.querySelectorAll(`[data-list-item-parent="${listContextId}"]`);

    let currentItemIndex = selectedItem.value?.index;

    // Special case where we are on default item and therefore do not know it's index
    if (typeof currentItemIndex !== 'number') {
      console.log('currentItemIndex not found, finding it', q.entries());
      for (const [index, item] of q.entries()) {
        if ((item as HTMLElement).dataset.listItem === defaultItemId.value) {
          console.log('item found', item);
          currentItemIndex = index;
          break;
        }
      }
    }

    const index = (currentItemIndex ?? -100) + (direction === 'up' ? -1 : 1);

    const clampedIndex = clamp(index, 0, Object.keys(items.value).length - 1);

    const item = q?.item(clampedIndex) as HTMLElement;
    if (!item) {
      console.warn('item not found');
      return;
    }

    const id = item.dataset.listItem as string;
    const handlers = items.value[id];
    if (!handlers) {
      console.warn('handlers not found');
      return;
    }

    selectedItem.value = { id, index: clampedIndex, handlers };
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleMove = (e: KeyboardEvent, type: 'onUp' | 'onDown' | 'onLeft' | 'onRight') => {
    console.log('handleMove', type, selectedItem.value?.handlers);

    if (selectedItem.value?.handlers[type]) {
      console.log('have custom handler');
      const continueDefault = selectedItem.value.handlers[type]?.(e);
      if (!continueDefault) {
        console.log('stop default');
        return;
      }
    }

    switch (type) {
      case 'onUp':
        e.preventDefault();
        selectMove('up');
        break;
      case 'onDown':
        e.preventDefault();
        selectMove('down');
        break;
    }
  };

  const handleConfirm = () => {
    if (selectedItem.value?.handlers.onSelect) {
      selectedItem.value.handlers.onSelect();
      return true;
    }
    return false;
  };

  const ctx = {
    registerItem,
    unregisterItem,
    selectedItemId,
    listContextId,
    handleMove,
  };

  provide(provideName, ctx);

  return {
    items,
    selectedItem,
    selectMove,
    handleMove,
    handleConfirm,
    _ctx: ctx,
  };
};

export const useKeyboardListContext = () => {
  const d = inject<ReturnType<typeof useKeyboardListManager>['_ctx']>(provideName);
  if (!d) {
    throw new Error('KeyboardListManager not found');
  }
  return d;
};
