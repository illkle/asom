import path from 'path-browserify';
import { z } from 'zod';

import * as fs from '@tauri-apps/plugin-fs';

export class ConfigTiedToSchema<T extends z.ZodSchema> {
  private readonly fileName: string;
  private readonly fileSchema: T;
  private readonly defaultData: z.infer<T>;

  constructor(fileName: string, fileSchema: T, defaultData: z.infer<T>) {
    this.fileName = fileName;
    this.fileSchema = fileSchema;
    this.defaultData = defaultData;
  }

  async get(schemaOwnerFolder: string) {
    const targetFile = path.join(schemaOwnerFolder, this.fileName);

    const def = this.fileSchema.parse(this.defaultData);

    try {
      const text = await fs.readTextFile(targetFile);
      const f = JSON.parse(text);
      return this.fileSchema.parse(f);
    } catch (e) {}
    return def;
  }

  async set(schemaOwnerFolder: string, data: z.infer<T>) {
    const targetFile = path.join(schemaOwnerFolder, this.fileName);
    await fs.writeTextFile(targetFile, JSON.stringify(data));
  }
}

export type IConfigTiedToSchema<T extends z.ZodSchema> = z.infer<T>;
