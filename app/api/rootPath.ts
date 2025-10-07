import type { QueryCache } from '@pinia/colada';
import { open } from '@tauri-apps/plugin-dialog';

const KEY = 'ROOT_PATH';

import { c_set_root_path_and_reinit } from '~/api/tauriActions';

const getPathFromUser = async () => {
  if (import.meta.env['TAURI_E2E_TESTING']) {
    const input = (await document.querySelector('input#rootPathE2E')) as HTMLInputElement;
    return input?.value;
  }

  return await open({
    multiple: false,
    directory: true,
  });
};

export const selectAndSetRootPath = async (qc: QueryCache) => {
  const result = await getPathFromUser();
  console.log('result', result);
  if (!result) return;

  await c_set_root_path_and_reinit(result);

  await qc.invalidateQueries({ key: ['rooPath'] });

  return result;
};
