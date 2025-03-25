import path from 'path-browserify';
import { onMounted, onUnmounted } from 'vue';
import { getDefaultViewSettings, useTabsStore } from '~/composables/stores/useTabsStore';

export const setupTabsHotkeys = () => {
  const store = useTabsStore();

  const rootPath = useRootPath();

  const actionKey = navigator.platform.indexOf('Mac') > -1 ? 'metaKey' : 'ctrlKey';

  const { query: usableSchemas } = useUsableSchemas();

  const hotkeyHandler = (e: KeyboardEvent) => {
    if (e.code === 'KeyT' && e[actionKey]) {
      e.preventDefault();

      store.openNewOne(
        {
          id: store.generateRandomId(),
          type: 'folder',
          thing: store.openedItem
            ? store.openedItem.type === 'file'
              ? path.dirname(store.openedItem.thing)
              : store.openedItem.thing
            : Object.keys(usableSchemas.data.value ?? {})[0],
          settings: getDefaultViewSettings(),
          scrollPosition: 0,
          recursive: true,
        },
        {
          place: 'last',
          focus: true,
        },
      );
    }

    if (e.code === 'KeyW' && e[actionKey]) {
      e.preventDefault();
      store.closeOpened();
    }

    if (e.code === 'BracketLeft' && e[actionKey] && e.shiftKey) {
      e.preventDefault();
      store.setOpenedIndexRelative(-1);
    }

    if (e.code === 'BracketRight' && e[actionKey] && e.shiftKey) {
      e.preventDefault();
      store.setOpenedIndexRelative(1);
    }

    if (e.code.startsWith('Digit') && e[actionKey]) {
      if (e.code === 'Digit9') {
        store.setOpenedIndex(store.openedTabs.length - 1);
      } else {
        store.setOpenedIndex(Number(e.code.replace('Digit', '')) - 1);
      }
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', hotkeyHandler);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', hotkeyHandler);
  });
};
