import { open } from '@tauri-apps/plugin-dialog';

const KEY = 'ROOT_PATH';

import { load, Store } from '@tauri-apps/plugin-store';

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
  return result;
};

export const getRootPath = async () => {
  if (process.env['FORCE_USER_PATH']) {
    return process.env['FORCE_USER_PATH'];
  }

  const store = await getStore();

  const res = await store.get(KEY);

  if (typeof res !== 'string') return null;

  return res;
};
