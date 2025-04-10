import path from 'path-browserify';
import { onMounted, onUnmounted } from 'vue';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';

export const setupTabsHotkeys = () => {
  const store = useTabsStoreV2();

  const actionKey = navigator.platform.indexOf('Mac') > -1 ? 'metaKey' : 'ctrlKey';

  const { query: usableSchemas } = useUsableSchemas();

  const hotkeyHandler = (e: KeyboardEvent) => {
    if (e.code === 'KeyT' && e[actionKey]) {
      e.preventDefault();

      store.openNewThingFast(
        {
          _type: 'folder',
          _path: store.openedItem
            ? store.openedItem._type === 'file'
              ? path.dirname(store.openedItem._path)
              : store.openedItem._path
            : Object.keys(usableSchemas.data.value ?? {})[0],
        },
        'last',
      );
    }

    if (e.code === 'KeyW' && e[actionKey]) {
      e.preventDefault();
      store.closeTab(store.openedTabActiveId);
    }

    if (e.code === 'BracketLeft' && e[actionKey] && e.shiftKey) {
      e.preventDefault();
      store.setOpenedIndexRelative(-1);
    }

    if (e.code === 'BracketRight' && e[actionKey] && e.shiftKey) {
      e.preventDefault();
      store.setOpenedIndexRelative(1);
    }
  };

  const mouseHandler = (e: MouseEvent) => {
    if (e.button === 3) {
      e.preventDefault();
      store.moveBack();
    }

    if (e.button === 4) {
      e.preventDefault();
      store.moveForward();
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', hotkeyHandler);
    window.addEventListener('mousedown', mouseHandler);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', hotkeyHandler);
  });
};
