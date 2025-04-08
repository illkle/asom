import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTabsStore, zOpenedFile } from '../useTabsStoreV2';

describe('useTabsStore', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia());
  });

  it('should start with empty tabs list', () => {
    const store = useTabsStore();

    expect(store.openedTabs).toEqual([]);
    expect(store.openedTabActiveId).toBe(undefined);
    expect(store.focusHistory).toEqual([]);
    expect(store.focusHistoryPointer).toBe(-1);
  });

  it('should add a new tab and update state correctly', () => {
    const store = useTabsStore();

    // Create a sample file tab
    const fileTab = zOpenedFile.parse({
      _type: 'file',
      _path: '/path/to/file.txt',
      scrollPosition: 0,
    });

    // Add a new tab
    store.openNewTab(fileTab);

    // Check that the tab was added
    expect(store.openedTabs.length).toBe(1);

    // Check that the tab has the correct structure
    const addedTab = store.openedTabs[0];
    expect(addedTab.id).toBeDefined();
    expect(addedTab.history).toHaveLength(1);
    expect(addedTab.history[0]).toEqual(fileTab);
    expect(addedTab.historyPointer).toBe(0);

    // Check that the tab is active

    console.log({
      openedTabActiveId: store.openedTabActiveId,
      openedTabActiveIndex: store.openedTabActiveIndex,
      openedTab: store.openedTab,
      focusHistory: store.focusHistory,
      focusHistoryPointer: store.focusHistoryPointer,
    });

    expect(store.openedTabActiveId).toBe(addedTab.id);

    // Check that focus history was updated
    expect(store.focusHistory).toHaveLength(1);
    expect(store.focusHistory[0]).toBe(addedTab.id);
    expect(store.focusHistoryPointer).toBe(0);
  });
});
