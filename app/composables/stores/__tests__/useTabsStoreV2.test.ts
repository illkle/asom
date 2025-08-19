import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  removeIndexesKeepingPointer,
  spliceKeepingPointer,
  useTabsStoreV2,
  zOpened,
  type IOpened,
} from '../useTabsStoreV2';

const mockFileID = (id: string) => {
  return zOpened.parse({
    _type: 'file',
    _path: `/path/to/file${id}.txt`,
    scrollPositionY: 0,
    scrollPositionX: 0,
    details: {},
  } satisfies IOpened);
};

const mockPath = (path: string, type: 'file' | 'folder' = 'file') => {
  return zOpened.parse({
    _type: type,
    _path: path,
    details: {
      searchQuery: '',
    },
    scrollPositionY: 0,
    scrollPositionX: 0,
  } satisfies IOpened);
};

const logDegug = (store: ReturnType<typeof useTabsStoreV2>, info?: string) => {
  console.log(info ?? '', {
    openedTab: store.openedTab,
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
    const store = useTabsStoreV2();

    expect(store.openedTabs).toEqual([]);
    expect(store.openedTabActiveId).toBe(undefined);
    expect(store.focusHistory).toEqual([]);
    expect(store.focusHistoryPointer).toBe(-1);
  });

  it('should add a new tab and update state correctly', () => {
    const store = useTabsStoreV2();

    // Create a sample file tab
    const fileTab = mockFileID('1');

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
    const store = useTabsStoreV2();

    // Create 4 tabs with different paths
    const tab1 = mockFileID('1');
    const tab2 = mockFileID('2');
    const tab3 = mockFileID('3');
    const tab4 = mockFileID('4');

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
    const store = useTabsStoreV2();

    // Create 4 tabs with different paths
    const tab1 = mockFileID('1');
    const tab2 = mockFileID('2');
    const tab3 = mockFileID('3');
    const tab4 = mockFileID('4');

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
    const updatedTab2 = mockFileID('5');
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
    const store = useTabsStoreV2();

    // Create one tab
    const initialTab = mockFileID('1');

    // Add the tab
    store.openNewTab(initialTab);

    // Check that we have 1 tab
    expect(store.openedTabs.length).toBe(1);
    expect(store.openedTabActiveId).toBe(store.openedTabs[0].id);

    // Update its state 5 times
    const state1 = mockFileID('2');
    const state2 = mockFileID('3');
    const state3 = mockFileID('4');
    const state4 = mockFileID('5');

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
    const newState = mockFileID('7');
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

  it('should evict oldest history entries when thresholds are exceeded', () => {
    const store = useTabsStoreV2();

    // Create one tab with initial entry
    const initialTab = mockFileID('0');
    store.openNewTab(initialTab);

    // Create 100 more entries for the tab (exceeding the 100 threshold)
    for (let i = 1; i <= 100; i++) {
      const newState = mockFileID(`${i}`);
      store.updateTabContent(newState);
    }

    // Lengh is 101, next one will evict 25
    expect(store.openedTabs[0].history.length).toBe(101);
    expect(store.openedTabs[0].historyPointer).toBe(100);

    // Update one more time, should evict 25
    const newState = mockFileID(`101`);
    store.updateTabContent(newState);
    expect(store.openedTabs[0].history.length).toBe(77); // 101 + 1 - 25 evicted entries
    expect(store.openedTabs[0].historyPointer).toBe(76);

    // Check that the focus history was reset to only contain the current tab
    expect(store.focusHistory).toEqual([store.openedTabs[0].id]);
    expect(store.focusHistoryPointer).toBe(0);

    // Create 50  more focus history entries (next one will evict 25)
    for (let i = 0; i < 50; i++) {
      const newTab = mockFileID(`focus-${i}`);
      store.openNewTab(newTab);
    }

    // Lengh is 51, next one will evict 25
    expect(store.focusHistory.length).toBe(51);
    expect(store.focusHistoryPointer).toBe(50);

    // Update one more time, should evict 25
    const newTab = mockFileID(`focus-52`);
    store.openNewTab(newTab);
    expect(store.focusHistory.length).toBe(27); // 51 + 1 - 25 evicted entries
    expect(store.focusHistoryPointer).toBe(26); // Adjusted pointer after eviction
  });

  it('should adjust focusHistoryPointer correctly when closing tabs', () => {
    const store = useTabsStoreV2();

    // Create 4 tabs with different paths
    const tab1 = mockFileID('1');
    const tab2 = mockFileID('2');
    const tab3 = mockFileID('3');
    const tab4 = mockFileID('4');

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

    // Close tab 2 (middle tab)
    const tab2Id = store.openedTabs[1].id;
    store.closeTab(tab2Id);

    // Check that focusHistoryPointer was adjusted correctly
    // We removed one tab whic was focues twice, therefore 6-2=4
    expect(store.focusHistoryPointer).toBe(4);

    // Close tab 1 (first tab)
    const tab1Id = store.openedTabs[0].id;
    store.closeTab(tab1Id);

    // Check that focusHistoryPointer was adjusted correctly
    // We removed one more entry from focusHistory, so pointer should decrease by 2 again
    expect(store.focusHistoryPointer).toBe(2);

    // Close tab 4 (last tab)
    const tab4Id = store.openedTabs[1].id;
    store.closeTab(tab4Id);

    // Check that tab 4 was removed
    expect(store.openedTabs.length).toBe(1);
    expect(store.openedTabs.find((tab) => tab.id === tab4Id)).toBeUndefined();

    // Check that focusHistoryPointer was adjusted correctly
    // We removed one more entry from focusHistory, so pointer should decrease by 1
    expect(store.focusHistoryPointer).toBe(1);

    // Close the last tab (tab 3)
    const tab3Id = store.openedTabs[0].id;
    store.closeTab(tab3Id);
    expect(store.openedTabs.length).toBe(0);
    expect(store.focusHistoryPointer).toBe(-1);
  });

  it('should behave correctly when closing after navigating back', () => {
    const store = useTabsStoreV2();

    // Create 4 tabs with different paths
    const tab1 = mockFileID('1');
    const tab2 = mockFileID('2');
    const tab3 = mockFileID('3');
    const tab4 = mockFileID('4');

    // Add all tabs
    store.openNewTab(tab1);
    store.openNewTab(tab2);
    store.openNewTab(tab3);
    store.openNewTab(tab4);

    expect(store.focusHistoryPointer).toBe(3);

    // Navigate back 3 times
    store.moveBack();
    store.moveBack();
    store.moveBack();

    const tab1Id = store.openedTabs[0].id;
    store.closeTab(tab1Id);

    expect(store.openedTabs.length).toBe(3);
    expect(store.openedTabActiveId).toBe(store.openedTabs[0].id);

    store.closeTab(store.openedTabs[0].id);
    expect(store.openedTabs.length).toBe(2);
    expect(store.openedTabActiveId).toBe(store.openedTabs[0].id);

    store.closeTab(store.openedTabs[0].id);
    expect(store.openedTabs.length).toBe(1);
    expect(store.openedTabActiveId).toBe(store.openedTabs[0].id);

    store.closeTab(store.openedTabs[0].id);
    expect(store.openedTabs.length).toBe(0);
    expect(store.openedTabActiveId).toBe(undefined);
  });

  it('should behave correctly when other tabs that exist in history', () => {
    const store = useTabsStoreV2();

    // Create 4 tabs with different paths
    const tab1 = mockFileID('1');
    const tab2 = mockFileID('2');
    const tab3 = mockFileID('3');
    const tab4 = mockFileID('4');

    // Add all tabs
    const tab1Id = store.openNewTab(tab1);
    const tab2Id = store.openNewTab(tab2);
    const tab3Id = store.openNewTab(tab3);
    const tab4Id = store.openNewTab(tab4);

    store.closeTab(tab2Id);

    expect(store.openedTabActiveId).toBe(tab4Id);

    store.moveBack();
    store.moveBack();

    expect(store.openedTabActiveId).toBe(tab1Id);

    expect(store.focusHistoryPointer).toBe(0);
  });

  it('should handle deletion events correctly', () => {
    const store = useTabsStoreV2();

    const root = '/sample/root';

    const barePath = `${root}/bare.md`;
    const nestedPath = `${root}/sub1/nested.md`;
    const doublenestedPath = `${root}/sub1/sub2/doublenested.md`;
    const sideNestedPath = `${root}/side/nested.md`;

    const bareId = store.openNewTab(mockPath(barePath));
    const nestedId = store.openNewTab(mockPath(nestedPath));
    const doublenestedId = store.openNewTab(mockPath(doublenestedPath));
    const sideNestedId = store.openNewTab(mockPath(sideNestedPath));

    // Delete precise file
    store._handlePathDeletion(sideNestedPath, false);
    expect(store.openedTabs.length).toBe(3);
    expect(store.openedTabActiveId).toBe(doublenestedId);

    expect(store.focusHistory.find((v) => v === sideNestedId)).toBe(undefined);
    expect(store.focusHistory.length).toBe(3);

    // Add some more to history of first tab then switch back
    store.focusTab(bareId);
    store.openNewThingFast({ _type: 'file', _path: nestedPath });
    store.openNewThingFast({ _type: 'file', _path: doublenestedPath });
    store.openNewThingFast({ _type: 'file', _path: barePath });

    expect(store.openedTabs.length).toBe(3);

    store.focusTab(doublenestedId);

    // Delete folder
    store._handlePathDeletion(`${root}/sub1`, true);

    console.log({ bareId, nestedId, doublenestedId, sideNestedId });

    expect(store.openedTabs.length).toBe(1);
    expect(store.openedTabActiveId).toBe(bareId);

    // Known bug that we have [bareId, bareId] in history, I have not implemented squashing logic yet
    expect(store.openedTab?.history.length).toBe(2);
  });

  it('should handle renames events correctly', () => {
    const store = useTabsStoreV2();

    const root = '/sample/root';

    const bareFolder = `${root}/bare`;
    const barePath = `${root}/bare.md`;
    const nestedFolderPath = `${root}/sub1`;
    const nestedPath = `${root}/sub1/nested.md`;
    const doublenestedFolderPath = `${root}/sub1/sub2/sub3`;
    const doublenestedPath = `${root}/sub1/sub2/doublenested.md`;
    const sideNestedPath = `${root}/side/nested.md`;

    const bareFolderId = store.openNewTab(mockPath(bareFolder, 'folder'));
    const bareId = store.openNewTab(mockPath(barePath));
    const nestedFolderId = store.openNewTab(mockPath(nestedFolderPath, 'folder'));
    const nestedId = store.openNewTab(mockPath(nestedPath));
    const doubleNestedFolderId = store.openNewTab(mockPath(doublenestedFolderPath, 'folder'));
    const doublenestedId = store.openNewTab(mockPath(doublenestedPath));
    const sideNestedId = store.openNewTab(mockPath(sideNestedPath));

    const allPaths = store.openedTabs.flatMap((tab) => tab.history.map((v) => v._path));

    expect(allPaths).toEqual([
      bareFolder,
      barePath,
      nestedFolderPath,
      nestedPath,
      doublenestedFolderPath,
      doublenestedPath,
      sideNestedPath,
    ]);

    store._handlePathRename(`${root}/sub1/`, `${root}/sub1-renamed`);
  });
});

describe('spliceKeepingPointer', () => {
  it('should remove an element and decrease pointer when pointer is after removed element', () => {
    const array = [1, 2, 3, 4, 5];
    const pointer = 3; // 4

    expect(array[pointer]).toBe(4);
    const newPointer = spliceKeepingPointer(array, pointer, 1);

    expect(array).toEqual([1, 3, 4, 5]);
    expect(array[newPointer.pointer]).toBe(4);
  });

  it('should remove an element and keep pointer unchanged when pointer is before removed element', () => {
    const array = [1, 2, 3, 4, 5];
    const pointer = 1;

    expect(array[pointer]).toBe(2);

    const newPointer = spliceKeepingPointer(array, pointer, 3);

    expect(array).toEqual([1, 2, 3, 5]);
    expect(array[newPointer.pointer]).toBe(2);
  });

  it('should handle removal of target element when its in the middle', () => {
    const array = [1, 2, 3, 4, 5];
    const pointer = 2;
    expect(array[pointer]).toBe(3);

    const newPointer = spliceKeepingPointer(array, pointer, pointer);

    expect(array).toEqual([1, 2, 4, 5]);
    expect(array[newPointer.pointer]).toBe(2);
  });

  it('should handle removal of target element when its first', () => {
    const array = [1, 2, 3, 4, 5];
    const pointer = 0;
    expect(array[pointer]).toBe(1);

    const newPointer = spliceKeepingPointer(array, pointer, pointer);

    expect(array).toEqual([2, 3, 4, 5]);
    expect(array[newPointer.pointer]).toBe(2);
  });

  it('should handle removal of target element when its last', () => {
    const array = [1, 2, 3, 4, 5];
    const pointer = 4;
    expect(array[pointer]).toBe(5);

    const newPointer = spliceKeepingPointer(array, pointer, pointer);

    expect(array).toEqual([1, 2, 3, 4]);
    expect(array[newPointer.pointer]).toBe(4);
  });
});

describe('removeIndexesKeepingPointer', () => {
  it('should remove indexes and keep pointer unchanged', () => {
    const array = [1, 2, 3, 4, 5];
    const pointer = 2;
    const indexesToRemove = [0, 1, 3, 4, 5];

    const newPointer = removeIndexesKeepingPointer(array, pointer, indexesToRemove);

    expect(array).toEqual([3]);
    expect(newPointer).toBe(0);
  });

  it('should handle deletion of current element when it is last', () => {
    const array = [1, 2, 3, 4, 5];
    const pointer = 4;
    const indexesToRemove = [0, 1, 2, 3];

    const newPointer = removeIndexesKeepingPointer(array, pointer, indexesToRemove);

    expect(array).toEqual([5]);
    expect(newPointer).toBe(0);
  });

  it('should handle deletion of current element when it is first', () => {
    const array = [1, 2, 3, 4, 5];
    const pointer = 0;
    const indexesToRemove = [1, 2, 3, 4];

    const newPointer = removeIndexesKeepingPointer(array, pointer, indexesToRemove);

    expect(array).toEqual([1]);
    expect(newPointer).toBe(0);
  });

  it('removal of all elements should return -1 as pointer', () => {
    const array = [1, 2, 3, 4, 5];
    const pointer = 0;
    const indexesToRemove = [0, 1, 2, 3, 4];

    const newPointer = removeIndexesKeepingPointer(array, pointer, indexesToRemove);

    expect(newPointer).toBe(-1);
  });
});
