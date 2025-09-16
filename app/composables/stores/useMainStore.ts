import { defineStore } from 'pinia';

import type { ErrFR, Schema } from '~/types';

export type MainStoreState = {
  errorModal: ErrFR | null;
  schemas: Schema[];
};

export const useMainStore = defineStore('main', {
  state: (): MainStoreState => {
    return {
      schemas: [],
      errorModal: null,
    };
  },
  actions: {
    // Err
    setError(data: ErrFR) {
      this.errorModal = data;
    },
  },
});
