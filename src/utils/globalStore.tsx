import { createStore } from 'solid-js/store';
import type { ErrorFromRust } from '~/types';

const [globalStore, setGlobalStore] = createStore({
  rootPath: null as string | null,
  errorDetailsModal: null as ErrorFromRust | null,
});

export { globalStore, setGlobalStore };
