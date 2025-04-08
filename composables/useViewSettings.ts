import type {
  ColumnOrderState,
  ColumnSizingState,
  SortingState,
  Updater,
  VisibilityState,
} from '@tanstack/vue-table';
import * as fs from '@tauri-apps/plugin-fs';
import path from 'path-browserify';

import { z } from 'zod';

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
  sorting: zSorting,
  columnVisibility: zVisibilityState,
  columnSizing: zSizingState,
  columnOrder: zOrderState,
});

export type IViewSettings = {
  sorting: SortingState;
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
  columnOrder: ColumnOrderState;
};

export const DEFAULT_VIEW_SETTINGS = () => ({
  sorting: [],
  columnVisibility: {},
  columnSizing: {},
  columnOrder: [],
});

const JSON_NAME = 'viewSettings.json';

export const getSettings = async (schemaOwnerFolder: string): Promise<IViewSettings> => {
  const targetFile = path.join(schemaOwnerFolder, JSON_NAME);

  const def = zViewSettings.parse(DEFAULT_VIEW_SETTINGS());

  try {
    const text = await fs.readTextFile(targetFile);
    const f = JSON.parse(text);
    return zViewSettings.parse(f);
  } catch (e) {}
  return def;
};

export const saveViewSettings = async (schemaOwnerFolder: string, settings: IViewSettings) => {
  const targetFile = path.join(schemaOwnerFolder, JSON_NAME);
  await fs.writeTextFile(targetFile, JSON.stringify(settings));
};

const VIEW_SETTINGS_KEY = (root: string | null | undefined, folderPath: string) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'schemas',
  'viewSettings',
  folderPath,
];

export const useViewSettings = (schemaOwnerFolder: Ref<string>) => {
  const root = useRootPath();

  const q = useQuery({
    key: () => VIEW_SETTINGS_KEY(root.data.value, schemaOwnerFolder.value),
    query: () => getSettings(schemaOwnerFolder.value),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const qc = useQueryCache();

  const viewSettingsUpdater = async <T extends keyof IViewSettings>(
    updaterOrValue: Updater<IViewSettings[T]>,
    key: T,
  ) => {
    const before =
      qc.getQueryData<IViewSettings>(VIEW_SETTINGS_KEY(root.data.value, schemaOwnerFolder.value)) ??
      DEFAULT_VIEW_SETTINGS();

    const beforeKey = before[key];
    const v = typeof updaterOrValue === 'function' ? updaterOrValue(beforeKey) : updaterOrValue;

    const after = { ...before, [key]: v };

    qc.setQueryData(VIEW_SETTINGS_KEY(root.data.value, schemaOwnerFolder.value), after);
    console.log('call saveViewSettings', schemaOwnerFolder.value, after);
    void saveViewSettings(schemaOwnerFolder.value, after);
  };

  return {
    q: q,
    viewSettingsUpdater,
  };
};
