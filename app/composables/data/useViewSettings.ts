import type { SortingState } from '@tanstack/vue-table';
import { z } from 'zod';
import { makeUseConfigHook } from '~/utils/configFiles';

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
  layoutWarningsHidden: z.boolean(),
});

export type IViewSettings = z.infer<typeof zViewSettings>;

export const DEFAULT_VIEW_SETTINGS = () =>
  ({
    sorting: [] as SortingState,
    columnVisibility: {},
    columnSizing: {},
    columnOrder: [],
    labelsHidden: false,
    layoutWarningsHidden: false,
  }) as IViewSettings;

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

export const useViewSettings = makeUseConfigHook(viewSettingsOnDisk, VIEW_SETTINGS_KEY);
