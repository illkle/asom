import { c_create_folder_for_default_schema, c_save_schema } from '~/api/tauriActions';
import type { IDynamicViewGroup } from '~/components/Modules/DynamicView/helpers';
import type { Schema } from '~/types';

const CURRENT_SCHEMA_VERSION = '1.0';

export const DefaultBookSchema: Schema = {
  name: 'Books',
  version: CURRENT_SCHEMA_VERSION,
  fill_from_filename: 'title',
  fill_api_search_from: 'title',
  items: [
    {
      name: 'title',
      value: {
        type: 'Text',
        settings: {
          settingsType: 'Text',
          displayName: 'Title',
          size: 'L',
          font: 'Serif',
          isMultiline: true,
        },
      },
    },
    {
      name: 'author',
      value: {
        type: 'Text',
        settings: {
          settingsType: 'Text',
          displayName: 'Author',
          size: 'M',
          weight: 'Bold',
        },
      },
    },
    {
      name: 'year',
      value: {
        type: 'Number',
        settings: {
          settingsType: 'Num',
          displayName: 'Year',
          size: 'S',
          min: 0,
        },
      },
    },
    {
      name: 'myRating',
      value: {
        type: 'Number',
        settings: {
          settingsType: 'Num',
          displayName: 'Rating',
          min: 0,
          max: 5,
          decimalPlaces: 1,
          style: 'Stars',
        },
      },
    },
    {
      name: 'read',
      value: {
        type: 'DatesPairCollection',
        settings: {
          settingsType: 'DatesPairCollection',
          displayName: 'Read',
        },
      },
    },
    {
      name: 'tags',
      value: {
        type: 'TextCollection',
        settings: {
          settingsType: 'TextCollection',
          displayName: 'Tags',
          prefix: '#',
        },
      },
    },
    {
      name: 'cover',
      value: {
        type: 'Image',
        settings: {
          settingsType: 'Image',
          displayName: 'Cover',
          aspectRatio: '2 /3',
        },
      },
    },
    {
      name: 'ISBN13',
      value: {
        type: 'Number',
        settings: {
          settingsType: 'Num',
          displayName: 'ISBN13',
          size: 'S',
          min: 0,
        },
      },
    },
  ],
} satisfies Schema;

const DefaultBookView: IDynamicViewGroup = {
  type: 'group',
  id: 'root',
  style: {
    direction: 'row',
    gap: '16',
    align: 'start',
    justify: 'start',
    sizeUnits: '1',
  },
  content: [
    {
      type: 'group',
      id: 'XbPf3lzNRS',
      style: {
        direction: 'column',
        gap: '4',
        align: 'start',
        justify: 'start',
        sizeUnits: '2',
      },
      content: [
        {
          id: 'cover',
          type: 'item',
        },
        {
          id: 'myRating',
          type: 'item',
        },
      ],
    },
    {
      type: 'group',
      id: 'C9ALPcBgSC',
      style: {
        direction: 'column',
        gap: '4',
        align: 'start',
        justify: 'start',
        sizeUnits: '5',
      },
      content: [
        {
          id: 'title',
          type: 'item',
        },
        {
          id: 'author',
          type: 'item',
        },
        {
          id: 'read',
          type: 'item',
        },
        {
          type: 'group',
          id: '7bYv3t8olf',
          style: {
            direction: 'row',
            gap: '4',
            align: 'start',
            justify: 'start',
            sizeUnits: '1',
          },
          content: [
            {
              id: 'year',
              type: 'item',
            },
            {
              id: 'ISBN13',
              type: 'item',
            },
          ],
        },
        {
          id: 'tags',
          type: 'item',
        },
      ],
    },
  ],
};

export const DefaultMovieSchema: Schema = {
  name: 'Movies',
  version: '1.0',
  fill_from_filename: 'title',
  fill_api_search_from: 'title',
  items: [
    {
      name: 'title',
      value: {
        type: 'Text',
        settings: {
          settingsType: 'Text',
          displayName: 'Title',
          size: 'L',
          font: 'Serif',
          isMultiline: true,
        },
      },
    },
    {
      name: 'director',
      value: {
        type: 'Text',
        settings: {
          settingsType: 'Text',
          displayName: 'Director',
          size: 'M',
          weight: 'Bold',
        },
      },
    },
    {
      name: 'premiere',
      value: {
        type: 'Date',
        settings: {
          settingsType: 'Date',
          displayName: 'Premiere',
        },
      },
    },
    {
      name: 'myRating',
      value: {
        type: 'Number',
        settings: {
          settingsType: 'Num',
          displayName: 'Rating',
          size: 'S',
          min: 0,
          max: 5,
          decimalPlaces: 1,
          style: 'Stars',
        },
      },
    },
    {
      name: 'watched',
      value: {
        type: 'DateCollection',
        settings: {
          settingsType: 'DateCollection',
          displayName: 'Watched',
        },
      },
    },
    {
      name: 'tags',
      value: {
        type: 'TextCollection',
        settings: {
          settingsType: 'TextCollection',
          displayName: 'Tags',
          prefix: '#',
        },
      },
    },
    {
      name: 'poster',
      value: {
        type: 'Image',
        settings: {
          settingsType: 'Image',
          displayName: 'Poster',
          aspectRatio: '2 / 3',
        },
      },
    },
  ],
} satisfies Schema;

export const DefaultMovieView: IDynamicViewGroup = {
  type: 'group',
  id: 'root',
  style: {
    direction: 'row',
    gap: '16',
    align: 'start',
    justify: 'start',
    sizeUnits: '1',
  },
  content: [
    {
      type: 'group',
      id: 'eO1iiAoNPO',
      style: {
        direction: 'column',
        gap: '4',
        align: 'start',
        justify: 'center',
        sizeUnits: '2',
      },
      content: [
        {
          id: 'poster',
          type: 'item',
        },
      ],
    },
    {
      type: 'group',
      id: '0iai5R4lYo',
      style: {
        direction: 'column',
        gap: '8',
        align: 'start',
        justify: 'start',
        sizeUnits: '5',
      },
      content: [
        {
          id: 'title',
          type: 'item',
        },
        {
          id: 'director',
          type: 'item',
        },
        {
          type: 'group',
          id: 'oG8w4bQfSM',
          style: {
            direction: 'row',
            gap: '16',
            align: 'start',
            justify: 'start',
            sizeUnits: '1',
          },
          content: [
            {
              id: 'watched',
              type: 'item',
            },
          ],
        },
        {
          id: 'tags',
          type: 'item',
        },
        {
          type: 'group',
          id: 'EJO5ddezzI',
          style: {
            direction: 'row',
            gap: '4',
            align: 'start',
            justify: 'start',
            sizeUnits: '1',
          },
          content: [
            {
              id: 'premiere',
              type: 'item',
            },
            {
              id: 'myRating',
              type: 'item',
            },
          ],
        },
      ],
    },
  ],
};

export const DefaultGameSchema: Schema = {
  name: 'Games',
  version: CURRENT_SCHEMA_VERSION,
  fill_from_filename: 'title',
  fill_api_search_from: 'title',
  items: [
    {
      name: 'title',
      value: {
        type: 'Text',
        settings: {
          settingsType: 'Text',
          displayName: 'Title',
          size: 'L',
          font: 'Serif',
          isMultiline: true,
        },
      },
    },
    {
      name: 'releaseDate',
      value: {
        type: 'Date',
        settings: {
          settingsType: 'Date',
          displayName: 'Release Date',
        },
      },
    },
    {
      name: 'myRating',
      value: {
        type: 'Number',
        settings: {
          settingsType: 'Num',
          displayName: 'Rating',
          min: 0,
          max: 10,
          style: 'Slider',
        },
      },
    },
    {
      name: 'played',
      value: {
        type: 'DatesPairCollection',
        settings: {
          settingsType: 'DatesPairCollection',
          displayName: 'Played',
        },
      },
    },
    {
      name: 'tags',
      value: {
        type: 'TextCollection',
        settings: {
          settingsType: 'TextCollection',
          displayName: 'Tags',
          prefix: '#',
        },
      },
    },
    {
      name: 'cover',
      value: {
        type: 'Image',
        settings: {
          settingsType: 'Image',
          displayName: 'Cover',
          aspectRatio: '2/3',
        },
      },
    },
    {
      name: 'publishers',
      value: {
        type: 'TextCollection',
        settings: {
          settingsType: 'TextCollection',
          displayName: 'Publishers',
          size: 'M',
          weight: 'Light',
        },
      },
    },
    {
      name: 'developers',
      value: {
        type: 'TextCollection',
        settings: {
          settingsType: 'TextCollection',
          displayName: 'Developers',
          size: 'M',
        },
      },
    },
  ],
} satisfies Schema;

const DefaultGameView: IDynamicViewGroup = {
  type: 'group',
  id: 'root',
  style: {
    direction: 'row',
    gap: '16',
    align: 'start',
    justify: 'start',
    sizeUnits: '1',
  },
  content: [
    {
      type: 'group',
      id: 'dtU2pcmtFN',
      style: {
        direction: 'column',
        gap: '4',
        align: 'start',
        justify: 'start',
        sizeUnits: '1',
      },
      content: [
        {
          id: 'cover',
          type: 'item',
        },
      ],
    },
    {
      type: 'group',
      id: 'cDLzMbUwcL',
      style: {
        direction: 'column',
        gap: '8',
        align: 'start',
        justify: 'start',
        sizeUnits: '2',
      },
      content: [
        {
          id: 'title',
          type: 'item',
        },
        {
          type: 'group',
          id: 'KOBeNkmHLp',
          style: {
            direction: 'row',
            gap: '16',
            align: 'center',
            justify: 'start',
            sizeUnits: '1',
          },
          content: [
            {
              id: 'releaseDate',
              type: 'item',
            },
            {
              id: 'myRating',
              type: 'item',
            },
          ],
        },
        {
          id: 'played',
          type: 'item',
        },
        {
          id: 'publishers',
          type: 'item',
        },
        {
          id: 'developers',
          type: 'item',
        },
        {
          id: 'tags',
          type: 'item',
        },
      ],
    },
  ],
};

export type DefaultSchemaPack = {
  name: string;
  schema: Schema;
  view: IDynamicViewGroup;
};

export const DefaultSchemaPacks: DefaultSchemaPack[] = [
  { name: 'Books', schema: DefaultBookSchema, view: DefaultBookView },
  { name: 'Movies', schema: DefaultMovieSchema, view: DefaultMovieView },
  { name: 'Games', schema: DefaultGameSchema, view: DefaultGameView },
];

export const createDefaultSchema = async (schema: DefaultSchemaPack, folderPath: string) => {
  await c_save_schema(folderPath, schema.schema);
  await saveViewLayout(folderPath, schema.view);
};

export const createDefaultSchemas = async () => {
  for (const pack of DefaultSchemaPacks) {
    const path = await c_create_folder_for_default_schema(pack.name);
    await createDefaultSchema(pack, path);
  }
};
