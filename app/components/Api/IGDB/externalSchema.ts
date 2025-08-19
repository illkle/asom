import { z } from 'zod';

export const zToken = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

export const zCover = z.object({
  id: z.number(),
  image_id: z.string(),
  url: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const zArtwork = z.object({
  id: z.number(),
  image_id: z.string(),
  url: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const zScreenshot = z.object({
  id: z.number(),
  image_id: z.string(),
  url: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const zCompany = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo: z
    .object({
      id: z.number(),
      image_id: z.string(),
      url: z.string().optional(),
    })
    .optional(),
});

export const zInvolvedCompany = z.object({
  id: z.number(),
  company: zCompany,
  developer: z.boolean().optional(),
  publisher: z.boolean().optional(),
  porting: z.boolean().optional(),
  supporting: z.boolean().optional(),
});

export const zGenre = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().optional(),
});

export const zPlatform = z.object({
  id: z.number(),
  name: z.string(),
  abbreviation: z.string().optional(),
  slug: z.string().optional(),
});

export const zReleaseDate = z.object({
  id: z.number(),
  date: z.number().optional(),
  human: z.string().optional(),
  platform: zPlatform.optional(),
  region: z.number().optional(),
});

export const zGame = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  storyline: z.string().optional(),
  first_release_date: z.number().optional(),
  rating: z.number().optional(),
  rating_count: z.number().optional(),
  aggregated_rating: z.number().optional(),
  aggregated_rating_count: z.number().optional(),
  total_rating: z.number().optional(),
  total_rating_count: z.number().optional(),
  cover: zCover.optional(),
  artworks: z.array(zArtwork).optional(),
  screenshots: z.array(zScreenshot).optional(),
  involved_companies: z.array(zInvolvedCompany).optional(),
  genres: z.array(zGenre).optional(),
  platforms: z.array(zPlatform).optional(),
  release_dates: z.array(zReleaseDate).optional(),
});

export type IGDBGame = z.infer<typeof zGame>;
export type IGDBCompany = z.infer<typeof zCompany>;
export type IGDBCover = z.infer<typeof zCover>;
