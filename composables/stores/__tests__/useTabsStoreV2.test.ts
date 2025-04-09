import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTabsStore, zOpenedFile } from '../useTabsStoreV2';

const mockFile = (id: string) => {
  return zOpenedFile.parse({
    _type: 'file',
    _path: `/path/to/file${id}.txt`,
    scrollPosition: 0,
  });
};

const logDegug = (store: ReturnType<typeof useTabsStore>, info?: string) => {
  console.log(info ?? '', {
    openedTabActiveId: store.openedTabActiveId,
    openedTabActiveIndex: store.openedTabActiveIndex,
    openedTabHistory: store.openedTab?.history,
    openedTabHistoryPointer: store.openedTab?.historyPointer,
    focusHistory: store.focusHistory,
    focusHistoryPointer: store.focusHistoryPointer,
    openedTabs: store.openedTabs,
  });
};

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
    const fileTab = mockFile('1');

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

  it('should handle adding new tabs and navigating back correctly', () => {
    const store = useTabsStore();

    // Create 4 tabs with different paths
    const tab1 = mockFile('1');
    const tab2 = mockFile('2');
    const tab3 = mockFile('3');
    const tab4 = mockFile('4');

    // Add all tabs
    store.openNewTab(tab1);
    store.openNewTab(tab2);
    store.openNewTab(tab3);
    store.openNewTab(tab4);

    // Check that we have 4 tabs
    expect(store.openedTabs.length).toBe(4);

    // Check that focus is on the last (4th) tab
    expect(store.openedTabActiveId).toBe(store.openedTabs[3].id);
    expect(store.focusHistoryPointer).toBe(3);

    // Focus tab 3, then tab 2, then tab 1
    store.focusTab(store.openedTabs[2].id); // Tab 3
    store.focusTab(store.openedTabs[1].id); // Tab 2
    store.focusTab(store.openedTabs[0].id); // Tab 1

    // Check that tab 1 is focused
    expect(store.openedTabActiveId).toBe(store.openedTabs[0].id);
    expect(store.focusHistoryPointer).toBe(6); // 4 initial + 3 focus changes

    // Check that focus history is correct
    expect(store.focusHistory).toHaveLength(7);
    expect(store.focusHistory[0]).toBe(store.openedTabs[0].id); // Tab 1
    expect(store.focusHistory[1]).toBe(store.openedTabs[1].id); // Tab 2
    expect(store.focusHistory[2]).toBe(store.openedTabs[2].id); // Tab 3
    expect(store.focusHistory[3]).toBe(store.openedTabs[3].id); // Tab 4
    expect(store.focusHistory[4]).toBe(store.openedTabs[2].id); // Tab 3 (focused)
    expect(store.focusHistory[5]).toBe(store.openedTabs[1].id); // Tab 2 (focused)
    expect(store.focusHistory[6]).toBe(store.openedTabs[0].id); // Tab 1 (focused)

    // Navigate back 3 times, check that we are on tab 4
    store.moveBack();
    store.moveBack();
    store.moveBack();

    expect(store.openedTabActiveId).toBe(store.openedTabs[3].id);
    expect(store.focusHistoryPointer).toBe(3);

    // Navigate back 3 more times, check that we are back on tab 1
    store.moveBack();
    store.moveBack();
    store.moveBack();

    expect(store.openedTabActiveId).toBe(store.openedTabs[0].id);
    expect(store.focusHistoryPointer).toBe(0);

    // Navigate forward 3 times, check that we are on tab 4
    store.moveForward();
    store.moveForward();
    store.moveForward();

    expect(store.openedTabActiveId).toBe(store.openedTabs[3].id);
    expect(store.focusHistoryPointer).toBe(3);
  });

  it('should handle tab content updates and navigation history correctly', () => {
    const store = useTabsStore();

    // Create 4 tabs with different paths
    const tab1 = mockFile('1');
    const tab2 = mockFile('2');
    const tab3 = mockFile('3');
    const tab4 = mockFile('4');

    // Add all tabs
    store.openNewTab(tab1);
    store.openNewTab(tab2);
    store.openNewTab(tab3);
    store.openNewTab(tab4);

    // Check that we have 4 tabs
    expect(store.openedTabs.length).toBe(4);

    // Check that focus is on the last (4th) tab
    expect(store.openedTabActiveId).toBe(store.openedTabs[3].id);
    expect(store.focusHistoryPointer).toBe(3);

    // Navigate back two times and check that we are on tab 2
    store.moveBack();
    store.moveBack();

    expect(store.openedTabActiveId).toBe(store.openedTabs[1].id);
    expect(store.focusHistoryPointer).toBe(1);

    // Update tab 2 content to a new state
    const updatedTab2 = mockFile('5');
    store.updateTabContent(updatedTab2);

    // Check that tab 2 content was updated correctly
    expect(store.openedTabs[1].history.length).toBe(2); // Original + updated
    expect(store.openedTabs[1].history[1]).toEqual(updatedTab2);
    expect(store.openedTabs[1].historyPointer).toBe(1);

    // Move back once, check that we returned to previous tab 2 state
    store.moveBack();

    expect(store.openedTabActiveId).toBe(store.openedTabs[1].id);
    expect(store.openedTabs[1].historyPointer).toBe(0);
    expect(store.openedTabs[1].history[0]).toEqual(tab2);

    // Move back one more, check that we returned to tab 1
    store.moveBack();

    expect(store.openedTabActiveId).toBe(store.openedTabs[0].id);
    expect(store.focusHistoryPointer).toBe(0);

    // Move forward twice, check that we are back to new tab 2 state
    store.moveForward();
    store.moveForward();

    expect(store.openedTabActiveId).toBe(store.openedTabs[1].id);
    expect(store.openedTabs[1].historyPointer).toBe(1);
    expect(store.openedTabs[1].history[1]).toEqual(updatedTab2);

    // We should not be able to navigate forward once more
    expect(store.canGoForward).toBe(false);
    store.moveForward();

    expect(store.openedTabActiveId).toBe(store.openedTabs[1].id);
    expect(store.openedTabs[1].historyPointer).toBe(1);
    expect(store.openedTabs[1].history[1]).toEqual(updatedTab2);
  });

  it('should handle multiple tab state updates and history navigation correctly', () => {
    const store = useTabsStore();

    // Create one tab
    const initialTab = mockFile('1');

    // Add the tab
    store.openNewTab(initialTab);

    // Check that we have 1 tab
    expect(store.openedTabs.length).toBe(1);
    expect(store.openedTabActiveId).toBe(store.openedTabs[0].id);

    // Update its state 5 times
    const state1 = mockFile('2');
    const state2 = mockFile('3');
    const state3 = mockFile('4');
    const state4 = mockFile('5');

    store.updateTabContent(state1);
    store.updateTabContent(state2);
    store.updateTabContent(state3);
    store.updateTabContent(state4);

    // Check that tab history has 6 entries (initial + 5 updates)
    expect(store.openedTabs[0].history.length).toBe(5);
    expect(store.openedTabs[0].historyPointer).toBe(4);

    // Navigate back two times
    store.moveBack();
    store.moveBack();

    // Check that we're on state2
    expect(store.openedTabs[0].historyPointer).toBe(2);
    expect(store.openedTabs[0].history[2]).toEqual(state2);

    // Update state once more to a completely new state
    const newState = mockFile('7');
    store.updateTabContent(newState);

    // Check that history is correct
    expect(store.openedTabs[0].history.length).toBe(4);
    expect(store.openedTabs[0].history[0]).toEqual(initialTab);
    expect(store.openedTabs[0].history[1]).toEqual(state1);
    expect(store.openedTabs[0].history[2]).toEqual(state2);
    expect(store.openedTabs[0].history[3]).toEqual(newState);
    expect(store.openedTabs[0].historyPointer).toBe(3);

    // Navigate back once, we should be on state2
    store.moveBack();
    expect(store.openedTabs[0].historyPointer).toBe(2);
    expect(store.openedTabs[0].history[2]).toEqual(state2);

    // Navigate back once more, we should be on state1
    store.moveBack();

    expect(store.openedTabs[0].historyPointer).toBe(1);
    expect(store.openedTabs[0].history[1]).toEqual(state1);

    // Navigate back once more, we should be on initial state
    store.moveBack();

    expect(store.openedTabs[0].historyPointer).toBe(0);
    expect(store.openedTabs[0].history[0]).toEqual(initialTab);
  });
});
