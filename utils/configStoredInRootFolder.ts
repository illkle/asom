import path from 'path-browserify';
import { z } from 'zod';
import { c_get_root_path } from '~/api/tauriActions';

import * as fs from '@tauri-apps/plugin-fs';

export class ConfigStoredInRootFolder<T extends z.ZodSchema> {
  private readonly fileName: string;
  private readonly fileSchema: T;

  constructor(fileName: string, fileSchema: T) {
    this.fileName = fileName;
    this.fileSchema = fileSchema;
  }

  async get() {
    const rootPath = await c_get_root_path();

    if (!rootPath) {
      throw new Error('Trying to read settings without root path present');
    }

    const targetFolder = path.join(rootPath, '/.internal/');
    const targetFile = path.join(targetFolder, this.fileName);

    const f = (await fs.exists(targetFile))
      ? JSON.parse(await fs.readTextFile(targetFile))
      : { tabs: [] };

    return this.fileSchema.parse(f);
  }

  async set(data: z.infer<T>) {
    const rootPath = await c_get_root_path();

    if (!rootPath) {
      throw new Error('Trying to write settings without root path present');
    }

    const targetFolder = path.join(rootPath, '/.internal/');
    const targetFile = path.join(targetFolder, this.fileName);

    if (!(await fs.exists(targetFolder))) {
      await fs.mkdir(targetFolder, { recursive: true });
    }

    await fs.writeTextFile(targetFile, JSON.stringify(data));
  }
}

export type IConfigStoredInRootFolder<T extends z.ZodSchema> = z.infer<T>;
