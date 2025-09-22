import { z } from 'zod';
import {
  defineExApiSchema,
  zApiSettingsBase,
  zApiToSchemaMapping,
  type ExApiData,
} from '~/components/Api/base';

export const zCredentialsOpenLibrary = z.object({
  olb_yourEmail: z.string().default(''),
});

export const zAPIOpenLibrary = zApiSettingsBase.extend({
  type: z.literal('openlibrary'),
  mapping: zApiToSchemaMapping,
});

export type ApiSettingsOpenLibrary = z.infer<typeof zAPIOpenLibrary>;

export const openLibraryAPISchema = defineExApiSchema({
  id: 'Text',
  title: 'Text',
  author_name: 'TextCollection',
  year: 'Number',
  cover_low_quality: 'Image',
  cover_high_quality: 'Image',
  isbn: 'Text',
});

export type OpenLibraryApiBook = ExApiData<typeof openLibraryAPISchema>;
