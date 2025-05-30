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

type DefaultSchemaPack = {
  name: string;
  schema: Schema;
};

export const DefaultSchemaPacks: DefaultSchemaPack[] = [
  { name: 'Books', schema: DefaultBookSchema },
  { name: 'Movies', schema: DefaultMovieSchema },
  { name: 'Games', schema: DefaultGameSchema },
];
