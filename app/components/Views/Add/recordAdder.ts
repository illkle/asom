import { toast } from 'vue-sonner';

import { path as tauriPath } from '@tauri-apps/api';
import { c_save_file } from '~/api/tauriActions';
import type { RecordFromDb } from '~/types';

export const addThing = async ({
  name,
  attrsInput,
  saveTo,
}: {
  name?: string;
  attrsInput?: RecordFromDb['attrs'];
  saveTo: string;
}) => {
  if (!name?.length) {
    console.log('no name', name);
    toast.error('Please enter a non empty file name');
    return;
  }

  const actualName = name.endsWith('.md') ? name : name + '.md';

  if (!saveTo) {
    console.error('no saveTo', saveTo);
    return;
  }

  const finalPath = await tauriPath.join(saveTo, actualName);

  console.log('finalPath', finalPath);

  const res = await c_save_file({
    record: {
      path: finalPath,
      attrs: attrsInput ?? {},
      markdown: '',
      modified: 0,
    },
    createNew: true,
  });

  return res.path;
};
