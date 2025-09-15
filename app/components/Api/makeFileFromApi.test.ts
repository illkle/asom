import { describe, expect, it, vi } from 'vitest';
import { makeFileAttrsFromApi } from '~/components/Api/makeFileFromApi';

vi.mock('~/components/Api/saveImage', () => ({
  saveImage: vi.fn().mockResolvedValue('cover.jpg'),
}));

describe('makeFileAttrsFromApi', () => {
  it('basic mapping from api', async () => {
    const res = await makeFileAttrsFromApi({
      apiSettings: {
        type: 'twitchigdb',
        clientId: '123',
        clientSecret: '123',
        accessToken: '123',
        expiresAt: 123,
        mapping: {
          name: {
            schemaName: 'name_s',
            converterFlags: {},
          },
          cover: {
            schemaName: 'cover_s',
            converterFlags: {},
          },
          first_release_date: {
            schemaName: 'releaseDate_s',
            converterFlags: {},
          },
          genres: {
            schemaName: 'genres_s',
            converterFlags: {},
          },
          companies_all: {
            schemaName: 'companies_all_s',
            converterFlags: {},
          },
        },
      },
      apiData: {
        id: 123,
        name: 'name',
        cover: 'cover',
        first_release_date: new Date(2010, 1, 1),
        genres: ['genre1', 'genre2'],
        rating: 123,
        platforms: ['platform1', 'platform2'],
        companies_all: ['company_a_1', 'company_a_2'],
        companies_developers: ['company_d_1', 'company_d_2'],
        companies_publishers: ['company_p_1', 'company_p_2'],
        companies_porting: ['company_p_1', 'company_p_2'],
        companies_supporting: ['company_s_1', 'company_s_2'],
      },
      schema: {
        name: 'Games',
        version: '1.0',
        items: [
          { name: 'name_s', value: { type: 'Text', settings: { settingsType: 'Text' } } },
          { name: 'cover_s', value: { type: 'Image', settings: { settingsType: 'Image' } } },
          { name: 'releaseDate_s', value: { type: 'Date', settings: {} } },
          {
            name: 'genres_s',
            value: { type: 'TextCollection', settings: { settingsType: 'TextCollection' } },
          },
          {
            name: 'companies_all_s',
            value: { type: 'TextCollection', settings: { settingsType: 'TextCollection' } },
          },
        ],
      },
      context: {
        rootPath: '123',
        recordName: '123',
      },
    });

    expect(res).toStrictEqual({
      name_s: { type: 'String', value: 'name' },
      cover_s: { type: 'String', value: 'cover.jpg' },
      releaseDate_s: { type: 'String', value: '2010-02-01' },
      genres_s: { type: 'StringVec', value: ['genre1', 'genre2'] },
      companies_all_s: { type: 'StringVec', value: ['company_a_1', 'company_a_2'] },
    });
  });
});
