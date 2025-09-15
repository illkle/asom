import { fetch } from '@tauri-apps/plugin-http';
import { z } from 'zod';
import type { IgdbApiGame } from '~/components/Api/IGDB';
import { zGame, zToken, type IGDBGame } from '~/components/Api/IGDB/externalSchema';

const getToken = async (clientId: string, clientSecret: string) => {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    {
      method: 'POST',
    },
  );
  const data = await res.json();

  return zToken.parse(data);
};

const igdbApiRequest = async ({
  token,
  clientId,
  endpoint,
  query,
}: {
  token: string;
  clientId: string;
  endpoint: string;
  query: string;
}) => {
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Client-ID': clientId,
    },
    body: query,
    method: 'POST',
  });

  console.log('res', res);

  if (!res.ok) {
    throw new Error(`IGDB API error: ${res.status} ${res.statusText}`);
  }

  return await res.json();
};

const igdbSearchGames = async ({
  token,
  clientId,
  name,
  limit = 10,
}: {
  token: string;
  clientId: string;
  name: string;
  limit?: number;
}) => {
  const query = `
    fields 
      id, name, slug, summary, storyline, first_release_date,
      rating, rating_count, aggregated_rating, aggregated_rating_count,
      total_rating, total_rating_count,
      cover.id, cover.image_id, cover.url, cover.width, cover.height,
      involved_companies.id, involved_companies.developer, involved_companies.publisher, 
      involved_companies.porting, involved_companies.supporting,
      involved_companies.company.id, involved_companies.company.name,
      genres.id, genres.name, genres.slug,
      platforms.id, platforms.name,
      release_dates.id, release_dates.date, release_dates.human, release_dates.region,
      release_dates.platform.id, release_dates.platform.name, release_dates.platform.abbreviation;
    search "${name}";
    limit ${limit};
    where version_parent = null;
  `;

  const data = await igdbApiRequest({ token, clientId, endpoint: 'games', query });
  console.log('data', data);
  return z.array(zGame).parse(data);
};

export const getGamesFromIGDB = async ({
  token,
  clientId,
  clientSecret,
  name,
  limit = 10,
  saveToken,
}: {
  token: string;
  clientId: string;
  clientSecret: string;
  name: string;
  limit?: number;
  saveToken: (token: string) => void;
}): Promise<IgdbApiGame[]> => {
  if (!token) {
    try {
      const t = await getToken(clientId, clientSecret);
      token = t.access_token;
      saveToken(token);
    } catch (e) {
      if (isOurError(e)) {
        console.log('our error', e);
        useRustErrorNotification(e);
      }
      useRustErrorNotification({
        isError: true,
        title: 'Failed to get token for IGDB',
        info: e instanceof Error ? e.message : 'Unknown error',
        subErrors: [],
      });
      return [];
    }
  }

  let gamesSource: IGDBGame[] = [];

  try {
    gamesSource = await igdbSearchGames({ token, clientId, name, limit });
  } catch (e) {
    const t = await getToken(clientId, clientSecret);
    token = t.access_token;
    saveToken(token);
    try {
      gamesSource = await igdbSearchGames({ token, clientId, name, limit });
    } catch (e) {
      useRustErrorNotification({
        isError: true,
        title: 'Failed to get games from IGDB',
        subErrors: [],
      });
      return [];
    }
  }

  return gamesSource.map(
    (game) =>
      ({
        id: game.id,
        name: game.name,
        cover: game.cover?.url
          ? `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${game.cover.image_id}.jpg`
          : undefined,
        first_release_date: game.first_release_date
          ? new Date(game.first_release_date * 1000)
          : undefined,
        rating: game.rating,
        genres: game.genres?.map((genre) => genre.name) ?? [],
        platforms: game.platforms?.map((platform) => platform.name) ?? [],
        companies_all:
          game.involved_companies
            ?.sort(
              (v) =>
                Number(v.developer) * 4 +
                Number(v.publisher) * 3 +
                Number(v.supporting) * 2 +
                Number(v.porting) * 1,
            )
            .map((company) => company.company.name) ?? [],
        companies_developers:
          game.involved_companies
            ?.filter((company) => company.developer)
            .sort((v) => Number(v.developer))
            .map((company) => company.company.name) ?? [],
        companies_publishers:
          game.involved_companies
            ?.filter((company) => company.publisher)
            .map((company) => company.company.name) ?? [],
        companies_porting:
          game.involved_companies
            ?.filter((company) => company.porting)
            .map((company) => company.company.name) ?? [],
        companies_supporting:
          game.involved_companies
            ?.filter((company) => company.supporting)
            .map((company) => company.company.name) ?? [],
      }) satisfies IgdbApiGame,
  );
};
