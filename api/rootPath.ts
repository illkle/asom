import { open } from '@tauri-apps/plugin-dialog';

const KEY = 'ROOT_PATH';

import { load, Store } from '@tauri-apps/plugin-store';
import { c_init } from '~/api/tauriActions';

let tauriStore: Store | null = null;

const getStore = async () => {
  if (!tauriStore) {
    tauriStore = await load('appData.bin');
  }
  return tauriStore;
};

const getPathFromUser = async () => {
  if (process.env['FAKE_SET_ROOT_DIR']) {
    return process.env['FAKE_SET_ROOT_DIR'];
  }

  return await open({
    multiple: false,
    directory: true,
  });
};

export const selectAndSetRootPath = async () => {
  const result = await getPathFromUser();
  if (!result) return;

  const store = await getStore();
  await store.set(KEY, result);
  await store.save();

  await c_init();

  const qc = useQueryCache();
  await qc.invalidateQueries({ key: ['root'] });

  return result;
};
