import path from 'path-browserify';
import { z } from 'zod';
import { c_get_root_path } from '~/api/tauriActions';

import * as fs from '@tauri-apps/plugin-fs';

export class ConfigStoredInRootFolder<T extends z.ZodSchema> {
  private readonly fileName: string;
  private readonly fileSchema: T;
  private readonly defaultData: z.infer<T>;

  constructor(fileName: string, fileSchema: T, defaultData: z.infer<T>) {
    this.fileName = fileName;
    this.fileSchema = fileSchema;
    try {
      this.defaultData = fileSchema.parse(defaultData);
    } catch (e) {
      console.error(e);
      throw new Error('Error parsing ConfigStoredInRootFolder DEFAULT DATA ' + this.fileName);
    }
  }

  async get() {
    const rootPath = await c_get_root_path();

    if (!rootPath) {
      throw new Error('Trying to read settings without root path present');
    }

    const targetFolder = path.join(rootPath, '/.asom_internal/');
    const targetFile = path.join(targetFolder, this.fileName);

    try {
      const text = await fs.readTextFile(targetFile);
      const f = JSON.parse(text);
      return this.fileSchema.parse(f);
    } catch (e) {
      console.error('Error reading ConfigStoredInRootFolder ' + this.fileName, e);
    }

    return this.defaultData;
  }

  async set(data: z.infer<T>) {
    const rootPath = await c_get_root_path();

    if (!rootPath) {
      throw new Error('Trying to write settings without root path present');
    }

    const targetFolder = path.join(rootPath, '/.asom_internal/');
    const targetFile = path.join(targetFolder, this.fileName);

    if (!(await fs.exists(targetFolder))) {
      await fs.mkdir(targetFolder, { recursive: true });
    }

    await fs.writeTextFile(targetFile, JSON.stringify(data));
  }
}

export type IConfigStoredInRootFolder<T extends z.ZodSchema> = z.infer<T>;
