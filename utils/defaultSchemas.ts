import { mkdir } from '@tauri-apps/plugin-fs';
import { c_save_schema } from '~/api/tauriActions';
import type { IDynamicViewGroup } from '~/components/DynamicView/helpers';
import type { Schema } from '~/types';

const CURRENT_SCHEMA_VERSION = '1.0';

export const DefaultBookSchema: Schema = {
  name: 'Books',
  version: CURRENT_SCHEMA_VERSION,
  items: [
    {
      name: 'title',
      value: {
        type: 'Text',
        settings: {
          settingsType: 'Text',
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
          size: 'S',
          min: 0,
          decimalPlaces: 0,
        },
      },
    },
    {
      name: 'myRating',
      value: {
        type: 'Number',
        settings: {
          settingsType: 'Num',
          size: 'S',
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
        settings: {},
      },
    },
    {
      name: 'tags',
      value: {
        type: 'TextCollection',
        settings: {
          settingsType: 'TextCollection',
          prefix: '#',
        },
      },
    },
    {
      name: 'cover',
      value: {
        type: 'Image',
        settings: {},
      },
    },
    {
      name: 'ISBN',
      value: {
        type: 'Text',
        settings: {
          settingsType: 'Text',
          size: 'S',
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
    width: 'auto',
  },
  content: [
    {
      type: 'group',
      id: 'XIddxdkdCf',
      style: {
        direction: 'column',
        gap: '4',
        align: 'center',
        justify: 'start',
        width: 'auto',
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
      id: 'PWJMAYs93F',
      style: {
        direction: 'column',
        gap: '16',
        align: 'start',
        justify: 'start',
        width: 'auto',
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
          type: 'group',
          id: '4hv2oDX8GJ',
          style: {
            direction: 'row',
            gap: '4',
            align: 'start',
            justify: 'start',
            width: 'auto',
          },
          content: [
            {
              id: 'year',
              type: 'item',
            },
            {
              id: 'ISBN',
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
        {
          id: 'read',
          type: 'item',
        },
      ],
    },
  ],
};

export const DefaultMovieSchema: Schema = {
  name: 'Movies',
  version: CURRENT_SCHEMA_VERSION,
  items: [
    {
      name: 'title',
      value: {
        type: 'Text',
        settings: {
          settingsType: 'Text',
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
          size: 'M',
          weight: 'Bold',
        },
      },
    },
    {
      name: 'premiere',
      value: {
        type: 'Date',
        settings: {},
      },
    },
    {
      name: 'myRating',
      value: {
        type: 'Number',
        settings: {
          settingsType: 'Num',
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
        settings: {},
      },
    },
    {
      name: 'tags',
      value: {
        type: 'TextCollection',
        settings: {
          settingsType: 'TextCollection',
          prefix: '#',
        },
      },
    },
    {
      name: 'poster',
      value: {
        type: 'Image',
        settings: {},
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
    width: 'auto',
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
        width: 'auto',
      },
      content: [
        {
          id: 'poster',
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
      id: '0iai5R4lYo',
      style: {
        direction: 'column',
        gap: '16',
        align: 'start',
        justify: 'start',
        width: 'auto',
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
            width: 'auto',
          },
          content: [
            {
              id: 'watched',
              type: 'item',
            },
            {
              id: 'premiere',
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

export const DefaultGameSchema: Schema = {
  name: 'Games',
  version: CURRENT_SCHEMA_VERSION,
  items: [
    {
      name: 'title',
      value: {
        type: 'Text',
        settings: {
          settingsType: 'Text',
          size: 'L',
          font: 'Serif',
          isMultiline: true,
        },
      },
    },
    {
      name: 'publisher',
      value: {
        type: 'Text',
        settings: {
          settingsType: 'Text',
          size: 'M',
          weight: 'Bold',
        },
      },
    },
    {
      name: 'releaseDate',
      value: {
        type: 'Date',
        settings: {},
      },
    },
    {
      name: 'myRating',
      value: {
        type: 'Number',
        settings: {
          settingsType: 'Num',
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
        settings: {},
      },
    },
    {
      name: 'tags',
      value: {
        type: 'TextCollection',
        settings: {
          settingsType: 'TextCollection',
          prefix: '#',
        },
      },
    },
    {
      name: 'cover',
      value: {
        type: 'Image',
        settings: {},
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
    width: 'auto',
  },
  content: [
    {
      id: 'rlBRNaMGaJ',
      type: 'group',
      style: {
        direction: 'column',
        gap: '4',
        align: 'start',
        justify: 'start',
        width: 'auto',
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
        {
          id: 'tags',
          type: 'item',
        },
      ],
    },
    {
      id: 'mOzkq9a7rU',
      type: 'group',
      style: {
        direction: 'column',
        gap: '8',
        align: 'start',
        justify: 'start',
        width: 'auto',
      },
      content: [
        {
          id: 'title',
          type: 'item',
        },
        {
          id: 'publisher',
          type: 'item',
        },
        {
          id: 'releaseDate',
          type: 'item',
        },
        {
          id: 'played',
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
  await mkdir(folderPath, { recursive: true });
  await c_save_schema(folderPath, schema.schema);
  await saveViewLayout(folderPath, schema.view);
};
