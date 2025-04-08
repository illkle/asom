import { defineStore } from 'pinia';

import ShortUniqueId from 'short-unique-id';
import { z } from 'zod';
import type { RenameProps } from '~/types/rename';

const uid = new ShortUniqueId({ length: 10 });

export const generateUniqId = () => uid.randomUUID();

/**
 * Each tab is zTabEntry. Each tab has id and content
 * Content can(and should) be updated on navigations.
 *
 * Tabs store history of all content changes and can naviage back and forward.
 * History is also stored for active tabs chages.
 * Navigating back means going back through tab history, then to previous tab, then through it's history etc.
 *
 * If you close the tab it gets removed from history, though we also store deletion histrory and can restore closed tabs.
 */

/**
 * Never mutate items prefixed with _ they must be modifiend via actions.
 * Other values can be mutated and v-model-ed.
 */

const zPathCore = z.object({
  _type: z.literal('folder'),
  _path: z.string(),
});

export const zOpenedPath = zPathCore.extend({
  scrollPosition: z.number(),
  details: z.object({
    searchQuery: z.string(),
  }),
});

const zFileCore = z.object({
  _type: z.literal('file'),
  _path: z.string(),
});

export const zOpenedFile = zFileCore.extend({
  scrollPosition: z.number(),
});

const zInnerPageCore = z.object({
  _type: z.literal('innerPage'),
  _path: z.enum(['goodreadsImporter']),
});

const zCore = z.discriminatedUnion('_type', [zFileCore, zInnerPageCore, zPathCore]);

export const zOpenedInnerPage = zInnerPageCore.extend({
  scrollPosition: z.number(),
});

export const zOpened = z.discriminatedUnion('_type', [zOpenedFile, zOpenedInnerPage, zOpenedPath]);

export const zTabEntry = z.object({
  id: z.string(),
  /** History is state. Tab without history is just an array of 1 item */
  history: z.array(zOpened).min(1),

  historyPointer: z.number(),
});

export const ZOpenedTabs = z.object({
  tabs: z.array(zTabEntry),
  activeId: z.string().default(''),
});

export type IOpenedPath = z.infer<typeof zOpenedPath>;
export type IOpenedFile = z.infer<typeof zOpenedFile>;
export type IOpenedInnerPage = z.infer<typeof zOpenedInnerPage>;
export type IOpened = z.infer<typeof zOpened>;
export type ITabEntry = z.infer<typeof zTabEntry>;
export type IOpenedTabs = z.infer<typeof ZOpenedTabs>;

type ICoreBase = z.infer<typeof zCore>;

type ICore = RenameProps<
  ICoreBase,
  {
    type: '_type';
    path: '_path';
  }
>;

/**
 * File Store
 */

//const openedTabsFile = new ConfigStoredInRootFolder('openedTabs.json', ZOpenedTabs);

/**
 * Pinia Store
 */

export type TabsStoreState = {
  openedTabs: IOpenedTabs['tabs'];
  focusHistory: IOpenedTabs['activeId'][];
  focusHistoryPointer: number;
};

export const useTabsStore = defineStore('tabs', {
  state: (): TabsStoreState => {
    return {
      openedTabs: [],
      focusHistory: [],
      /** -1 means no active tab */
      focusHistoryPointer: -1,
    };
  },

  getters: {
    openedTabActiveId: (state) => {
      return state.focusHistory[state.focusHistoryPointer];
    },

    openedTabActiveIndex(state) {
      const activeID = state.focusHistory[state.focusHistoryPointer];
      if (!activeID) return;
      return state.openedTabs.findIndex((v) => v.id === activeID);
    },

    openedTab(): ITabEntry | undefined {
      if (typeof this.openedTabActiveId !== 'string') return;

      return this.openedTabs.find((v) => v.id === this.openedTabActiveId);
    },

    canGoBack() {
      if (!this.openedTab) return false;

      if (this.openedTab?.historyPointer > 0) return true;
      if (this.focusHistoryPointer > 0) return true;

      return false;
    },

    canGoForward() {
      if (!this.openedTab) return false;

      if (this.openedTab?.historyPointer < this.openedTab?.history.length - 1) return true;
      if (this.focusHistoryPointer < this.focusHistory.length - 1) return true;

      return false;
    },
  },
  actions: {
    _clearForwardHistoryItem(target: ITabEntry) {
      if (target.historyPointer !== target.history.length - 1) {
        /** If we are not at the end of history, we need to remove all history items after the current one */
        target.history.splice(target.historyPointer, Infinity);
      }
    },
    _clearFocusHistory() {
      if (this.focusHistoryPointer !== this.focusHistory.length - 1) {
        this.focusHistory.splice(this.focusHistoryPointer, Infinity);
      }
    },

    updateTabContent(data: IOpened, params?: { targetId?: string; scrollPosition?: number }) {
      const target = params?.targetId
        ? this.openedTabs.find((t) => t.id === params.targetId)
        : this.openedTab;

      if (!target) return;

      this._clearForwardHistoryItem(target);
      if (this.openedTab?.id === target.id) {
        this._clearFocusHistory();
      }

      target.history.push(data);
    },

    focusTab(id: string) {
      if (this.openedTab) {
        this._clearForwardHistoryItem(this.openedTab);
      }
      this._clearFocusHistory();

      this.focusHistory.push(id);
      this.focusHistoryPointer++;
    },

    openNewTab(
      data: IOpened,
      params: {
        place: 'after' | 'last' | number;
        focus?: boolean;
      } = {
        place: 'last',
        focus: true,
      },
    ) {
      const newTab: ITabEntry = {
        id: generateUniqId(),
        history: [data],
        historyPointer: 0,
      };

      const place = params.place;

      if (typeof place === 'number') {
        this.openedTabs.splice(place, 0, newTab);
      } else if (place === 'last') {
        this.openedTabs.push(newTab);
      } else if (place === 'after' && typeof this.openedTabActiveIndex === 'number') {
        this.openedTabs.splice(this.openedTabActiveIndex + 1, 0, newTab);
      }

      if (params.focus) {
        this.focusTab(newTab.id);
      }
    },

    closeTab(id: string) {
      const index = this.openedTabs.findIndex((t) => t.id === id);

      if (index === -1) return;

      this.openedTabs.splice(index, 1);
      const lenBefore = this.focusHistory.length;
      this.focusHistory = this.focusHistory.filter((id) => id !== id);
      const lenAfter = this.focusHistory.length;

      if (lenBefore !== lenAfter) {
        this.focusHistoryPointer += lenBefore - lenAfter;
      }
    },
  },
});
