import { defineStore } from 'pinia';

import type { ErrFR, Schema } from '~/types';

export type MainStoreState = {
  errorModal: ErrFR | null;
  schemas: Schema[];
  view: 'app' | 'schemas';
};

export const useMainStore = defineStore('main', {
  state: (): MainStoreState => {
    return {
      schemas: [],
      errorModal: null,
      view: 'app',
    };
  },
  actions: {
    // Err
    setError(data: ErrFR) {
      this.errorModal = data;
    },
    setView(view: 'app' | 'schemas') {
      this.view = view;
    },
  },
});
