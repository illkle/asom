import z from 'zod';
import {
  defineExApiSchema,
  zApiSettingsBase,
  type ExApiData,
  type ExApiSchema,
} from '~/components/Api/base';
import { igdbAPISchema, zAPIIGDB, zCredentialsIGDB } from '~/components/Api/IGDB';
import {
  openLibraryAPISchema,
  zAPIOpenLibrary,
  zCredentialsOpenLibrary,
} from '~/components/Api/OpenLibrary';

/** Credentials are stored on disk for root schema */
export const zApiCredentials = z.object({}).and(zCredentialsIGDB).and(zCredentialsOpenLibrary);

/** Settings are stored on disk for each schema */
export const zApiSettings = z.discriminatedUnion('type', [
  zAPIIGDB,
  zAPIOpenLibrary,
  zApiSettingsBase.extend({
    type: z.literal('none'),
  }),
]);

export type ApiSettings = z.infer<typeof zApiSettings>;

type ApiKey = ApiSettings['type'];

/** Api data is what is returned from the API */

export const ApiDataMap = {
  twitchigdb: igdbAPISchema,
  openlibrary: openLibraryAPISchema,
  none: defineExApiSchema({ id: 'Text' }),
} satisfies Record<ApiKey, ExApiSchema>;

export type ApiDataMapping = typeof ApiDataMap;

export type InferApiData<T extends ApiKey> = ExApiData<ApiDataMapping[T]>;

export const API_Types = Object.keys(ApiDataMap) as ApiKey[];
