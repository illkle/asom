import path from 'path-browserify';
import { z } from 'zod';

import * as fs from '@tauri-apps/plugin-fs';
import { throttle } from 'lodash-es';

export class ConfigTiedToSchema<T extends z.ZodSchema> {
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
      throw new Error('Error parsing ConfigTiedToSchema DEFAULT DATA ' + this.fileName);
    }
  }

  async get(schemaOwnerFolder: string) {
    if (!schemaOwnerFolder) {
      return this.defaultData;
    }

    const targetFolder = path.join(schemaOwnerFolder, '/.asom/');
    const targetFile = path.join(targetFolder, this.fileName);

    if (!(await fs.exists(targetFolder))) {
      await fs.mkdir(targetFolder, { recursive: true });
    }

    try {
      const text = await fs.readTextFile(targetFile);
      const f = JSON.parse(text);
      return this.fileSchema.parse(f);
    } catch (e) {
      console.error('Error reading ConfigTiedToSchema ' + this.fileName, e);
    }

    return this.defaultData;
  }

  async set(schemaOwnerFolder: string, data: z.infer<T>) {
    console.log('trying to set', schemaOwnerFolder, data);

    if (!schemaOwnerFolder) {
      return;
    }

    const targetFolder = path.join(schemaOwnerFolder, '/.asom/');
    const targetFile = path.join(targetFolder, this.fileName);
    if (!(await fs.exists(targetFolder))) {
      await fs.mkdir(targetFolder, { recursive: true });
    }
    await fs.writeTextFile(targetFile, JSON.stringify(data));
  }
}

export type IConfigTiedToSchema<T extends z.ZodSchema> = z.infer<T>;

/** Having an editable ref instead of get\set via useQuery makes things significantly simpler.
 * The downside is that we don't have invalidation on external file\data changes.
 * Though it's probably not a issue, at least until we have split view.
 */
export const makeConfigTiedToSchemaHook = <T extends z.ZodSchema>(
  configTiedToSchema: ConfigTiedToSchema<T>,
) => {
  return (schemaOwnerFolder: Ref<string>, manualSave: boolean = false) => {
    const data = ref<z.infer<T> | undefined>(undefined);
    const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');

    const load = async () => {
      if (!schemaOwnerFolder.value || status.value === 'loading') {
        return;
      }

      status.value = 'loading';
      try {
        data.value = await configTiedToSchema.get(schemaOwnerFolder.value);
        status.value = 'ready';
      } catch (e) {
        console.error(e);
        status.value = 'error';
      }
    };

    watch(
      schemaOwnerFolder,
      async (v) => {
        await load();
      },
      { immediate: true },
    );

    const save = async (v: z.infer<T>) => {
      if (!schemaOwnerFolder.value || status.value === 'loading') {
        return;
      }
      await configTiedToSchema.set(schemaOwnerFolder.value, v);
    };

    const throttledSave = throttle(save, 400, { trailing: true });

    onBeforeUnmount(() => {
      throttledSave.flush();
    });

    watch(
      data,
      async (v) => {
        if (manualSave) {
          return;
        }

        if (!schemaOwnerFolder.value || status.value === 'loading') {
          return;
        }
        throttledSave(v);
      },
      { deep: true },
    );

    return {
      data,
      status,
      save,
    };
  };
};
