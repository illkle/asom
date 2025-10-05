import { defineStore } from 'pinia';

import type { ErrFR } from '~/types';

export type MainStoreState = {
  errorModal: ErrFR | null;
};

export const useMainStore = defineStore('main', {
  state: (): MainStoreState => {
    return {
      errorModal: null,
    };
  },
  actions: {
    setError(data: ErrFR) {
      this.errorModal = data;
    },
  },
});
