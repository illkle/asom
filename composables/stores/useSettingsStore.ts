import * as fs from '@tauri-apps/plugin-fs';
import * as path from '@tauri-apps/api/path';

import { z } from 'zod';

export const zSettings = z.object({
  recursiveFolders: z.boolean().default(false),
  dateFormat: z.string().default('yyyy-MM-dd'),
  dateLocale: z.string().default('en-GB'),
  coversPath: z.string().default('covers'),
  darkMode: z.enum(['Light', 'System', 'Dark']).default('System'),
});

export type ISettings = z.infer<typeof zSettings>;

const FOLDER_NAME = '.internal';
const JSON_NAME = 'settings.json';

export const getSettings = async () => {
  const rootPath = rootPathFromStore();

  if (!rootPath) {
    throw new Error('Trying to read settings without root path present');
  }

  const targetFolder = await path.join(rootPath, FOLDER_NAME);

  const targetFile = await path.join(targetFolder, JSON_NAME);

  const def = zSettings.parse({});

  if (!(await fs.exists(targetFile))) {
    return def;
  }

  try {
    const f = (await fs.exists(targetFile)) ? JSON.parse(await fs.readTextFile(targetFile)) : {};

    return zSettings.parse(f);
  } catch (e) {}
  return def;
};

export const saveSettings = async (settings: ISettings) => {
  const rootPath = rootPathFromStore();

  if (!rootPath) {
    throw new Error('Trying to write settings without root path present');
  }

  const targetFolder = await path.join(rootPath, FOLDER_NAME);
  const targetFile = await path.join(targetFolder, JSON_NAME);

  if (!(await fs.exists(targetFolder))) {
    fs.mkdir(targetFolder);
  }

  fs.writeTextFile(targetFile, JSON.stringify(settings));
  return;
};

export const useSettingsStore = defineStore('userSettings', {
  state: (): { settings: ISettings } => {
    return { settings: zSettings.parse({}) };
  },

  actions: {
    async loadSettings() {
      this.settings = await getSettings();
    },

    async updateSettings(settings: Partial<ISettings>) {
      this.settings = { ...this.settings, ...settings };
      await saveSettings(this.settings);
    },
  },
});
