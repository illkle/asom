import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import path from 'path-browserify';
import z from 'zod';
import { defineExApiSchema, type ExApiData, type ExApiSchema } from '~/components/Api/base';
import { igdbAPISchema, zAPIIGDB } from '~/components/Api/IGDB';
import type { RecordFromDb } from '~/types';

/** Settings are stored on disk for each schema */

export const zApiSettings = z.discriminatedUnion('type', [
  zAPIIGDB,
  z.object({
    type: z.literal('none'),
  }),
]);

export type ApiSettings = z.infer<typeof zApiSettings>;

type ApiKey = ApiSettings['type'];

/** Api data is what is returned from the API */

const ApiDataMap = {
  twitchigdb: igdbAPISchema,
  none: defineExApiSchema({}),
} satisfies Record<ApiKey, ExApiSchema>;

export type ApiDataMapping = typeof ApiDataMap;

export type InferApiData<T extends ApiKey> = ExApiData<ApiDataMapping[T]>;

export const API_Types = Object.keys(ApiDataMap) as ApiKey[];

export const makeFileAttrsFromApi = async <T extends ApiSettings>(
  apiSettings: T,
  apiData: InferApiData<T['type']>,
  mapping: Record<string, string | null | undefined>,
  rootPath: string,
  recordName: string,
): Promise<RecordFromDb['attrs']> => {
  if (!rootPath) {
    throw new Error('Root path is required');
  }

  const result: RecordFromDb['attrs'] = {};

  const apiSchema = ApiDataMap[apiSettings.type];

  for (const key in apiSchema) {
    const type = apiSchema[key as keyof typeof apiSchema];

    const value = apiData[key as keyof typeof apiData];

    const mappedKey = mapping[key];

    if (!mappedKey) continue;

    switch (type) {
      case 'Text':
        result[mappedKey] = {
          type: 'String',
          value: value as string,
        };
        break;
      case 'TextCollection':
        result[mappedKey] = {
          type: 'StringVec',
          value: value as string[],
        };
        break;
      case 'Number':
        result[mappedKey] = {
          type: 'Integer',
          value: value as number,
        };
        break;
      case 'Image':
        const imageName = await saveImage(value as string, rootPath, recordName);

        result[mappedKey] = {
          type: 'String',
          value: imageName,
        };
        break;
      case 'Date':
        result[mappedKey] = {
          type: 'String',
          value: jsDateToFileString(value as Date),
        };
        break;
      case 'DateCollection':
        result[mappedKey] = {
          type: 'StringVec',
          value: (value as Date[]).map((v) => jsDateToFileString(v)),
        };
        break;
    }
  }

  return result;
};

const saveImage = async (
  imageUrl: string,
  rootPath: string,
  recordName: string,
): Promise<string> => {
  const folder = path.join(rootPath, '.assets');

  const folderExists = await exists(folder);
  if (!folderExists) {
    await mkdir(folder, { recursive: true });
  }

  const fileName = `${recordName}-${generateUniqId()}.jpg`;

  const image = await fetch(imageUrl);

  const imageBlob = await image.blob();

  const imageBuffer = await imageBlob.arrayBuffer();

  const imagePath = path.join(folder, fileName);

  await writeFile(imagePath, new Uint8Array(imageBuffer));

  return fileName;
};
