import path from 'path-browserify';
import { z } from 'zod';

import * as fs from '@tauri-apps/plugin-fs';
import { cloneDeep } from 'lodash-es';
import { c_get_root_path } from '~/api/tauriActions';
import { useRootPathInjectSafe } from '~/composables/data/providers';

type PathGetter<Specifier extends string | undefined> = (
  fileName: string,
  target?: Specifier extends undefined ? undefined : Specifier,
) => Promise<{ folder: string; file: string }>;

export class ConfigGeneric<
  FileSchema extends z.ZodSchema,
  PathGetterSpecifier extends string | undefined,
> {
  private readonly fileName: string;
  readonly fileSchema: FileSchema;
  private readonly defaultData: z.infer<FileSchema>;
  readonly pathGetter: PathGetter<PathGetterSpecifier>;
  constructor(
    fileName: string,
    fileSchema: FileSchema,
    defaultData: z.infer<FileSchema>,
    pathGetter: PathGetter<PathGetterSpecifier>,
  ) {
    this.fileName = fileName;
    this.fileSchema = fileSchema;
    this.pathGetter = pathGetter;
    try {
      this.defaultData = fileSchema.parse(defaultData);
    } catch (e) {
      console.error(e);
      throw new Error('Error parsing ConfigGeneric  default Data  ' + this.fileName);
    }
  }

  async get(target?: PathGetterSpecifier extends undefined ? undefined : PathGetterSpecifier) {
    try {
      const { folder, file } = await this.pathGetter(this.fileName, target);

      if (!(await fs.exists(folder))) {
        await fs.mkdir(folder, { recursive: true });
      }

      const text = await fs.readTextFile(file);
      const f = JSON.parse(text);
      console.log('returning parsed data', f);
      return this.fileSchema.parse(f);
    } catch (e) {
      console.error('Error reading ConfigGeneric ' + this.fileName, e);
    }

    return this.defaultData;
  }

  async set(
    data: z.infer<FileSchema>,
    target?: PathGetterSpecifier extends undefined ? undefined : PathGetterSpecifier,
  ) {
    if (typeof target === 'string' && !target.length) {
      return;
    }

    const { folder, file } = await this.pathGetter(this.fileName, target);
    if (!(await fs.exists(folder))) {
      await fs.mkdir(folder, { recursive: true });
    }
    await fs.writeTextFile(file, JSON.stringify(data));
  }
}

/** Schema Config */

const pathGetterForSchemaConfig = async (fileName: string, schemaOwnerFolder?: string) => {
  if (!schemaOwnerFolder) {
    throw new Error('Schema owner folder is not set');
  }

  const folder = path.join(schemaOwnerFolder, '/.asom/');
  const file = path.join(folder, fileName);
  return { folder, file };
};

export class ConfigTiedToSchema<FileSchema extends z.ZodSchema> extends ConfigGeneric<
  FileSchema,
  string
> {
  constructor(fileName: string, fileSchema: FileSchema, defaultData: z.infer<FileSchema>) {
    super(fileName, fileSchema, defaultData, pathGetterForSchemaConfig);
  }
}

/** Root Folder Config */

const pathGetterForRootFolder = async (fileName: string) => {
  const rootPath = await c_get_root_path();

  if (!rootPath) {
    throw new Error('Root path is not set');
  }

  const folder = path.join(rootPath, '/.asom_internal/');
  const file = path.join(folder, fileName);
  return { folder, file };
};

export class ConfigStoredInRootFolder<FileSchema extends z.ZodSchema> extends ConfigGeneric<
  FileSchema,
  undefined
> {
  constructor(fileName: string, fileSchema: FileSchema, defaultData: z.infer<FileSchema>) {
    super(fileName, fileSchema, defaultData, pathGetterForRootFolder);
  }
}

export const makeUseConfigHook = <T extends z.ZodSchema, A extends string | undefined>(
  disk: ConfigGeneric<T, A>,
  keyFn: (root: string | null | undefined, target: A extends undefined ? undefined : A) => string[],
) => {
  return (target?: A extends undefined ? undefined : Ref<A>) => {
    const root = useRootPathInjectSafe();

    const q = useQuery({
      key: () => keyFn(root.value, target?.value as A extends undefined ? undefined : A),
      query: () => disk.get(target?.value as A extends undefined ? undefined : A),
    });

    const qc = useQueryCache();

    const m = useMutation({
      mutation: async (newData: z.infer<T>) => {
        await disk.set(newData, target?.value as A extends undefined ? undefined : A);
      },
      onMutate: (newData) =>
        qc.setQueryData(
          keyFn(root.value, target?.value as A extends undefined ? undefined : A),
          newData,
        ),
    });

    const mutateUpdater = async (u: (v: z.infer<T>) => z.infer<T> | z.infer<T>) => {
      const current = qc.getQueryData<z.infer<T>>(
        keyFn(root.value, target?.value as A extends undefined ? undefined : A),
      );
      if (!current) {
        return;
      }
      // @ts-expect-error No idea how to type this
      m.mutate(typeof u === 'function' ? u(cloneDeep(current)) : u);
    };

    const partialUpdater = async (part: Partial<z.infer<T>>) => {
      const current = qc.getQueryData<z.infer<T>>(
        keyFn(root.value, target?.value as A extends undefined ? undefined : A),
      );
      if (!current) {
        return;
      }
      // @ts-expect-error No idea how to type this
      m.mutate({ ...current, ...part });
    };

    return { q, m, mutateUpdater, partialUpdater };
  };
};
