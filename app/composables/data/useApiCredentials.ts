import type z from 'zod';
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
  return await disk.get();
};

export const setApiCredentials = async (credentials: z.infer<typeof zApiCredentials>) => {
  await disk.set(credentials);
};
