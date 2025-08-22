import { z } from 'zod';
import { defineExApiSchema, type ExApiData } from '~/components/Api/base';

export const zAPIOpenLibrary = z.object({
  type: z.literal('openlibrary'),
  yourEmail: z.string().default(''),
  mapping: z.record(z.string(), z.string().or(z.null())).default({}),
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
