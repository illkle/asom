import { z } from 'zod';

import * as path from '@tauri-apps/api/path';
import * as fs from '@tauri-apps/plugin-fs';
import { c_get_root_path } from '~/api/tauriActions';

export const zSortByOption = z.enum([
  'Title',
  'Author',
  'Year',
  'Last Read',
  'First Read',
  'Rating',
  'Filename',
]);

export type ISortByOption = z.infer<typeof zSortByOption>;

export const zSortDirection = z.literal<-1>(-1).or(z.literal<1>(1));

export type ISortDirection = z.infer<typeof zSortDirection>;

export const zViewStyle = z.enum(['Covers', 'Lines']);

export type IViewStyle = z.infer<typeof zViewStyle>;

export const zViewSettings = z.object({
  grouped: z.boolean(),
  sortBy: zSortByOption,
  sortDirection: zSortDirection,
  viewStyle: zViewStyle,
  searchQuery: z.string(),
});

export type IViewSettings = z.infer<typeof zViewSettings>;

export const zOpenedPath = z.object({
  id: z.string(),
  type: z.literal('folder'),
  // Path
  thing: z.string(),
  settings: zViewSettings,
  recursive: z.boolean().optional(),
  scrollPosition: z.number(),
});

export type IOpenedPath = z.infer<typeof zOpenedPath>;

export const zOpenedFile = z.object({
  id: z.string(),
  type: z.literal('file'),
  // Path
  thing: z.string(),
  scrollPosition: z.number(),
});

export type IOpenedFile = z.infer<typeof zOpenedFile>;

export const zOpenedInnerPage = z.object({
  id: z.string(),
  type: z.literal('innerPage'),
  thing: z.enum(['home', 'settings']),
  scrollPosition: z.number(),
});

export type IOpenedInnerPage = z.infer<typeof zOpenedInnerPage>;

export const zOpened = z.discriminatedUnion('type', [zOpenedFile, zOpenedInnerPage, zOpenedPath]);

export type IOpened = z.infer<typeof zOpened>;

export const ZOpenedTabs = z.object({
  tabs: z.array(zOpened),
  activeId: z.string().default(''),
});

export type IOpenedTabs = z.infer<typeof ZOpenedTabs>;

const JSON_NAME = 'openedTabs.json';

export const getOpenedTabs = async () => {
  const rootPath = await c_get_root_path();

  if (!rootPath) {
    throw new Error('Trying to read settings without root path present');
  }

  const targetFolder = await path.join(rootPath, '/.internal/');
  const targetFile = await path.join(targetFolder, JSON_NAME);

  try {
    const f = (await fs.exists(targetFile))
      ? JSON.parse(await fs.readTextFile(targetFile))
      : { tabs: [] };

    return ZOpenedTabs.parse(f);
  } catch (e) {
    return { tabs: [], activeId: '' };
  }
};

export const setOpenedTabs = async (tabs: IOpenedTabs) => {
  const rootPath = await c_get_root_path();

  if (!rootPath) {
    throw new Error('Trying to write settings without root path present');
  }

  const targetFolder = await path.join(rootPath, '/.internal/');
  const targetFile = await path.join(targetFolder, JSON_NAME);

  if (!fs.exists(targetFolder)) {
    fs.mkdir(targetFolder);
  }

  fs.writeTextFile(targetFile, JSON.stringify(tabs));
  return;
};
