import * as fs from '@tauri-apps/plugin-fs';
import path from 'path-browserify';

import { z } from 'zod';
import { c_resolve_schema_path } from '~/api/tauriActions';

const zSorting = z.array(
  z.object({
    desc: z.boolean(),
    id: z.string(),
  }),
);

const zVisibilityState = z.record(z.boolean());

const zSizingState = z.record(z.number());
const zOrderState = z.array(z.string());

const zViewSettings = z.object({
  sorting: zSorting.optional(),
  columnVisibility: zVisibilityState.optional(),
  columnSizing: zSizingState.optional(),
  columnOrder: zOrderState.optional(),
});

export type IViewSettings = z.infer<typeof zViewSettings>;

const JSON_NAME = 'viewSettings.json';

export const getSettings = async (folderPath: string): Promise<IViewSettings> => {
  const schemaPath = await c_resolve_schema_path(folderPath);

  if (!schemaPath?.file_path) {
    return {};
  }

  const folder = await path.dirname(schemaPath.owner_folder);
  const targetFile = await path.join(folder, JSON_NAME);

  const def = zViewSettings.parse({});

  try {
    const f = JSON.parse(await fs.readTextFile(targetFile));
    return zViewSettings.parse(f);
  } catch (e) {}
  return def;
};

export const saveSettings = async (schemaPath: string, settings: IViewSettings) => {
  const folder = await path.dirname(schemaPath);
  const targetFile = await path.join(folder, JSON_NAME);
  await fs.writeTextFile(targetFile, JSON.stringify(settings));
  console.log('saved settings', settings);
};

const VIEW_SETTINGS_KEY = (root: string | null | undefined, folderPath: string) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'schemas',
  'viewSettings',
  folderPath,
];

export const useViewSettings = (folderPath: string) => {
  const root = useRootPath();

  const q = useQuery({
    key: () => VIEW_SETTINGS_KEY(root.data.value, folderPath),
    query: () => getSettings(folderPath),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  const qc = useQueryCache();

  const viewSettingsUpdater = async (
    updaterOrValue: (prev: any) => any,
    key: keyof IViewSettings,
  ) => {
    const before =
      qc.getQueryData<IViewSettings>(VIEW_SETTINGS_KEY(root.data.value, folderPath)) ?? {};

    const beforeKey = before[key];
    const v = typeof updaterOrValue === 'function' ? updaterOrValue(beforeKey) : updaterOrValue;

    const after = { ...before, [key]: v };

    qc.setQueryData(VIEW_SETTINGS_KEY(root.data.value, folderPath), after);
    await saveSettings(folderPath, after);
  };

  return {
    q: q,
    viewSettingsUpdater,
  };
};
