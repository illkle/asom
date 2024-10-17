import { defineStore, acceptHMRUpdate } from 'pinia';

import { clamp as _clamp, cloneDeep } from 'lodash';
import { cloneDeep as _cloneDeep } from 'lodash';
import ShortUniqueId from 'short-unique-id';

import {
  type IOpenedTabs,
  type IOpened,
  type IViewSettings,
  setOpenedTabs,
  getOpenedTabs,
} from '~/api/openedTabs';
import { getRootPath } from '~/api/rootPath';
import { getSettings, type ISettings } from '~/api/settings';

const uid = new ShortUniqueId({ length: 10 });

export type StateType = {
  rootPath: string | null;
  openedTabs: IOpenedTabs['tabs'];
  openedTabsActiveId: IOpenedTabs['activeId'];
  settings: ISettings | null;
};

export type OpenNewOneParams =
  | {
      place: 'current' | 'next' | 'last';
      focus?: boolean;
    }
  | {
      place: 'replace' | 'insert';
      index: number;
      focus?: boolean;
    };

export const useStore = defineStore('main', {
  state: (): StateType => {
    return {
      rootPath: null,
      settings: null,
      openedTabs: [],
      openedTabsActiveId: '',
    };
  },
  actions: {
    //
    // Opened Tabs
    //

    generateRandomId() {
      return uid.randomUUID();
    },

    openNewOne(item: IOpened, params: OpenNewOneParams) {
      // Place: 'last' is covered here
      let indexToSet = this.openedTabs.length;

      if (params.place === 'insert' || params.place === 'replace') {
        indexToSet = params.index;
      } else if (typeof this.openedTabsActiveIndex === 'number') {
        if (params.place === 'current') {
          indexToSet = this.openedTabsActiveIndex;
        }

        if (params.place === 'next') {
          indexToSet = this.openedTabsActiveIndex + 1;
        }
      }

      if (params.place === 'insert') {
        this.openedTabs.splice(indexToSet, 0, item);
      } else {
        this.openedTabs[indexToSet] = item;
      }

      if (params.focus) {
        this.openedTabsActiveId = item.id;
      }

      this.saveOpened();
    },

    closeOpened(index?: number) {
      if (typeof index !== 'number') {
        index = this.openedTabsActiveIndex;
      }
      if (typeof index !== 'number') return;

      this.openedTabs.splice(index, 1);
      this.setOpenedIndex(index);
      this.saveOpened();
    },

    async saveOpened() {
      const clone: IOpenedTabs = cloneDeep({
        tabs: this.openedTabs,
        activeId: this.openedTabsActiveId,
      });

      setOpenedTabs(clone);
    },
    async fetchOpened() {
      const res = await getOpenedTabs();
      this.openedTabs = res.tabs;
      this.openedTabsActiveId = res.activeId;
    },
    async fetchSetting() {
      this.settings = await getSettings();
    },
    async fetchRootPath() {
      this.rootPath = await getRootPath();
    },

    setOpenedId(id: string) {
      this.openedTabsActiveId = id;
    },

    setOpenedIndex(index: number) {
      if (!this.openedTabs.length) return;

      index = _clamp(index, 0, this.openedTabs.length - 1);

      this.openedTabsActiveId = this.openedTabs[index].id;
    },
    setOpenedIndexRelative(offset: number) {
      if (!this.openedTabs.length || typeof this.openedTabsActiveIndex !== 'number') return;

      const max = this.openedTabs.length;

      this.setOpenedIndex((this.openedTabsActiveIndex + offset + max) % max);
    },

    saveScrollPosition(index: number, value: number) {
      this.openedTabs[index].scrollPosition = value;
    },

    //
    // Updates
    //
    updateSettings(data: ISettings) {
      this.settings = data;
    },
    updateOpened(data: IOpenedTabs['tabs']) {
      this.openedTabs = data;
    },
  },
  getters: {
    openedTabsActiveIndex: (state) => {
      if (typeof state.openedTabsActiveId !== 'string') return;
      const res = state.openedTabs.findIndex((t) => t.id === state.openedTabsActiveId);
      return res === -1 ? undefined : res;
    },

    openedItem(): IOpened | undefined {
      if (typeof this.openedTabsActiveIndex === 'number') {
        return this.openedTabs[this.openedTabsActiveIndex];
      }
    },
    currentViewSettings(): IViewSettings | undefined {
      if (!this.openedItem) return;
      if (this.openedItem.type !== 'folder' && this.openedItem.type !== 'tag') return undefined;

      return this.openedItem.settings;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));
}

export const rootPathFromStore = () => {
  const store = useStore();

  const r = store.rootPath;

  if (typeof r !== 'string') {
    throw new Error('No Root Path');
  }

  return r;
};
