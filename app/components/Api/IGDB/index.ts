import { z } from 'zod';
import {
  defineExApiSchema,
  zApiSettingsBase,
  zApiToSchemaMapping,
  type ExApiData,
} from '~/components/Api/base';

export const zCredentialsIGDB = z.object({
  igdb_clientId: z.string().default(''),
  igdb_clientSecret: z.string().default(''),
  igdb_accessToken: z.string().default(''),
  igdb_expiresAt: z.number().default(0),
});

export const zAPIIGDB = zApiSettingsBase.extend({
  type: z.literal('twitchigdb'),
  mapping: zApiToSchemaMapping,
});

export type ApiSettingsIGDB = z.infer<typeof zAPIIGDB>;

export const igdbAPISchema = defineExApiSchema({
  id: 'Number',
  name: 'Text',
  cover: 'Image',
  first_release_date: 'Date',
  rating: 'Number',
  genres: 'TextCollection',
  platforms: 'TextCollection',
  companies_all: 'TextCollection',
  companies_developers: 'TextCollection',
  companies_publishers: 'TextCollection',
  companies_porting: 'TextCollection',
  companies_supporting: 'TextCollection',
});

export type IgdbApiGame = ExApiData<typeof igdbAPISchema>;
