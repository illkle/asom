import type { Row } from '@tanstack/vue-table';
import { describe, expect, it } from 'vitest';
import type { AttrValue, RecordFromDb, SchemaItem } from '~/types';

import { compareRecordsByType, getSortFunction } from './helpers';

const columnId = 'value';

const makeRecord = (value?: AttrValue): RecordFromDb => ({
  path: null,
  modified: 0,
  markdown: null,
  attrs: value ? { [columnId]: value } : {},
});

const makeSortingRow = (value: AttrValue): Row<RecordFromDb> =>
  ({ original: makeRecord(value) }) as unknown as Row<RecordFromDb>;

const compare = (
  type: SchemaItem['value']['type'],
  aValue: AttrValue | undefined,
  bValue: AttrValue | undefined,
) => compareRecordsByType(type, makeRecord(aValue), makeRecord(bValue), columnId);

describe('compareRecordsByType', () => {
  it('sorts Text attrs alphabetically', () => {
    expect(
      compare('Text', { type: 'String', value: 'Alpha' }, { type: 'String', value: 'Beta' }),
    ).toBeLessThan(0);
  });

  it('sorts null Text attrs as empty strings', () => {
    expect(
      compare('Text', { type: 'String', value: null }, { type: 'String', value: 'Beta' }),
    ).toBe(''.localeCompare('Beta'));
  });

  it('sorts Date attrs by timestamp', () => {
    expect(
      compare(
        'Date',
        { type: 'String', value: '2024-01-01' },
        { type: 'String', value: '2024-02-01' },
      ),
    ).toBeLessThan(0);
  });

  it('sorts null Date attrs as zero timestamps', () => {
    expect(compare('Date', { type: 'String', value: null }, { type: 'String', value: null })).toBe(
      0,
    );
  });

  it('sorts Number attrs across integer and float values', () => {
    expect(compare('Number', { type: 'Integer', value: 2 }, { type: 'Float', value: 1.5 })).toBe(
      0.5,
    );
  });

  it('sorts null Number attrs as zero', () => {
    expect(compare('Number', { type: 'Integer', value: null }, { type: 'Float', value: 3 })).toBe(
      -3,
    );
  });

  it('sorts TextCollection attrs by their first item', () => {
    expect(
      compare(
        'TextCollection',
        { type: 'StringVec', value: ['Alpha', 'Zulu'] },
        { type: 'StringVec', value: ['Beta'] },
      ),
    ).toBeLessThan(0);
  });

  it('sorts empty TextCollection attrs as empty strings', () => {
    expect(
      compare('TextCollection', { type: 'StringVec', value: [] }, { type: 'StringVec', value: [] }),
    ).toBe(0);
  });

  it('sorts DateCollection attrs by their first item', () => {
    expect(
      compare(
        'DateCollection',
        { type: 'StringVec', value: ['2024-01-01', '2024-12-31'] },
        { type: 'StringVec', value: ['2024-02-01'] },
      ),
    ).toBeLessThan(0);
  });

  it('sorts empty DateCollection attrs as zero timestamps', () => {
    expect(
      compare('DateCollection', { type: 'StringVec', value: [] }, { type: 'StringVec', value: [] }),
    ).toBe(0);
  });

  it('sorts DatesPairCollection attrs by the first pair finished date when present', () => {
    expect(
      compare(
        'DatesPairCollection',
        { type: 'DatePairVec', value: [{ started: '2024-01-01', finished: '2024-12-31' }] },
        { type: 'DatePairVec', value: [{ started: '2024-02-01', finished: '2024-03-01' }] },
      ),
    ).toBeGreaterThan(0);
  });

  it('falls back to started date when the first DatesPairCollection pair has no finished date', () => {
    expect(
      compare(
        'DatesPairCollection',
        { type: 'DatePairVec', value: [{ started: '2024-01-01' }] },
        { type: 'DatePairVec', value: [{ started: '2024-02-01' }] },
      ),
    ).toBeLessThan(0);
  });

  it('sorts empty DatesPairCollection attrs as zero timestamps', () => {
    expect(
      compare(
        'DatesPairCollection',
        { type: 'DatePairVec', value: [] },
        { type: 'DatePairVec', value: [] },
      ),
    ).toBe(0);
  });

  it('returns zero when either compared attr is missing', () => {
    expect(compare('Text', { type: 'String', value: 'Alpha' }, undefined)).toBe(0);
  });

  it('returns zero when attr types do not match the schema type', () => {
    expect(
      compare(
        'DateCollection',
        { type: 'String', value: '2024-01-01' },
        { type: 'StringVec', value: [] },
      ),
    ).toBe(0);
  });

  it('returns zero for schema types without custom sorting', () => {
    expect(
      compare('Image', { type: 'String', value: 'a.png' }, { type: 'String', value: 'b.png' }),
    ).toBe(0);
  });
});

describe('getSortFunction', () => {
  it('wraps compareRecordsByType for TanStack row sorting', () => {
    const sort = getSortFunction('Number');
    const a = makeSortingRow({ type: 'Integer', value: 1 });
    const b = makeSortingRow({ type: 'Integer', value: 3 });

    expect(typeof sort).toBe('function');
    expect(sort(a, b, columnId)).toBe(-2);
  });
});
