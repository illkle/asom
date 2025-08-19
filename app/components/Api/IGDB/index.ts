import { z } from 'zod';
import { defineExApiSchema, type ExApiData } from '~/components/Api/base';

export const zAPIIGDB = z.object({
  type: z.literal('twitchigdb'),
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  accessToken: z.string().default(''),
  expiresAt: z.number().default(0),
  mapping: z.record(z.string(), z.string().or(z.null())).default({}),
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
