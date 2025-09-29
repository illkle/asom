import type z from 'zod';
import { c_get_root_path } from '~/api/tauriActions';
import { zApiCredentials } from '~/components/Api/apis';
import { makeUseConfigHook } from '~/utils/configFiles';

const disk = new ConfigStoredInRootFolder(
  'apiCredentials.json',
  zApiCredentials,
  {} as z.infer<typeof zApiCredentials>,
);

const KEY = (root: string | null | undefined) => [...KEY_DEPENDENT_ON_ROOT(root), 'apiCredentials'];

export const useApiCredentials = makeUseConfigHook(disk, KEY);

export const getApiCredentials = async () => {
  const root = await c_get_root_path();
  if (!root) {
    throw new Error('Root path is not set');
  }
  return await disk.get(root);
};

export const setApiCredentials = async (credentials: z.infer<typeof zApiCredentials>) => {
  const root = await c_get_root_path();
  if (!root) {
    throw new Error('Root path is not set');
  }
  await disk.set(root, credentials);
};
