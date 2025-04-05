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

export const getSettings = async (schemaPath: string) => {
  const folder = await path.dirname(schemaPath);
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
};

export const useViewSettingsStore = defineStore('viewSettings', {
  state: (): { settingsCache: Record<string, IViewSettings> } => {
    return { settingsCache: {} };
  },

  actions: {
    async loadSettings(folderPath: string) {
      const schemaPath = await c_resolve_schema_path(folderPath);

      if (!schemaPath?.file_path) {
        return {};
      }

      if (this.settingsCache[schemaPath.owner_folder]) {
        return this.settingsCache[schemaPath.owner_folder];
      }

      this.settingsCache[schemaPath.owner_folder] = await getSettings(schemaPath.file_path);
      return this.settingsCache[schemaPath.owner_folder];
    },

    async updateSettings(folderPath: string, settings: IViewSettings) {
      const schemaPath = await c_resolve_schema_path(folderPath);
      this.settingsCache[folderPath] = settings;
      if (!schemaPath?.file_path) {
        return {};
      }

      await saveSettings(schemaPath.file_path, settings);
    },
  },
});
