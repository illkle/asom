import type {
  ColumnOrderState,
  ColumnSizingState,
  SortingState,
  Updater,
  VisibilityState,
} from '@tanstack/vue-table';

import { z } from 'zod';

const zSorting = z.array(
  z.object({
    desc: z.boolean(),
    id: z.string(),
  }),
);

const zVisibilityState = z.record(z.string(), z.boolean());

const zSizingState = z.record(z.string(), z.number());
const zOrderState = z.array(z.string());

const zViewSettings = z.object({
  sorting: zSorting,
  columnVisibility: zVisibilityState,
  columnSizing: zSizingState,
  columnOrder: zOrderState,
  labelsHidden: z.boolean(),
});

export type IViewSettings = {
  sorting: SortingState;
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
  columnOrder: ColumnOrderState;
  labelsHidden: boolean;
};

export const DEFAULT_VIEW_SETTINGS = () => ({
  sorting: [],
  columnVisibility: {},
  columnSizing: {},
  columnOrder: [],
  labelsHidden: false,
});

const viewSettingsOnDisk = new ConfigTiedToSchema(
  'viewSettings.json',
  zViewSettings,
  DEFAULT_VIEW_SETTINGS(),
);

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
    query: () => viewSettingsOnDisk.get(schemaOwnerFolder.value),
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
    void viewSettingsOnDisk.set(schemaOwnerFolder.value, after);
  };

  return {
    q: q,
    viewSettingsUpdater,
  };
};
