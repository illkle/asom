/*
Глобальный код для удаления вкладок закрытых файлов
// Global hook for deleted files
useListenToEvent('FileRemove', (path) => {
  if (store.openedItem?.thing === path) {
    store.closeOpened();
  }

  nextTick(() => {
    const filtered = store.openedTabs.filter((v) => v.thing !== path);

    if (filtered.length !== store.openedTabs.length) {
      store.updateOpened(filtered);
    }
  });
});

 */
