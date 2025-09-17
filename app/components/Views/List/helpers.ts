import type { SortingFn, SortingFnOption } from '@tanstack/vue-table';
import { parse } from 'date-fns';
import type { AttrValue, RecordFromDb, SchemaItem } from '~/types';

export type ColumnMeta = {
  type: SchemaItem['value']['type'];
};

export const baseSizeByType = (type: SchemaItem['value']['type']) => {
  switch (type) {
    case 'Text':
      return 200;
    case 'Date':
      return 75;
    case 'TextCollection':
      return 150;
    case 'DateCollection':
      return 150;
    case 'DatesPairCollection':
      return 150;
    default:
      return 100;
  }
};

export const getSortFunction = (
  type: SchemaItem['value']['type'],
): SortingFn<RecordFromDb> | SortingFnOption<RecordFromDb> => {
  switch (type) {
    case 'Text':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original.attrs[columnId], b.original.attrs[columnId]];
        if (!aValue || !bValue) return 0;
        if (aValue.type !== 'String' || bValue.type !== 'String') {
          return 0;
        }
        return (aValue.value ?? '').localeCompare(bValue.value ?? '');
      };
    case 'Date':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original.attrs[columnId], b.original.attrs[columnId]];
        if (!aValue || !bValue) return 0;
        if (aValue.type !== 'String' || bValue.type !== 'String') {
          return 0;
        }

        const [d1, d2] = [
          aValue.value ? parse(aValue.value ?? '', DATE_FORMAT, new Date()).getTime() : 0,
          bValue.value ? parse(bValue.value ?? '', DATE_FORMAT, new Date()).getTime() : 0,
        ];

        return d1 - d2;
      };
    case 'Number':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original.attrs[columnId], b.original.attrs[columnId]];
        if (!aValue || !bValue) return 0;
        if (
          (aValue.type !== 'Float' && aValue.type !== 'Integer') ||
          (bValue.type !== 'Float' && bValue.type !== 'Integer')
        ) {
          return 0;
        }

        return (aValue.value ?? 0) - (bValue.value ?? 0);
      };
    case 'TextCollection':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original.attrs[columnId], b.original.attrs[columnId]];
        if (!aValue || !bValue) return 0;
        if (aValue.type !== 'StringVec' || bValue.type !== 'StringVec') {
          return 0;
        }

        return (aValue.value?.[0] ?? '').localeCompare(bValue.value?.[0] ?? '');
      };
    case 'DateCollection':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original.attrs[columnId], b.original.attrs[columnId]];
        if (!aValue || !bValue) return 0;
        if (aValue.type !== 'StringVec' || bValue.type !== 'StringVec') {
          return 0;
        }

        const [av, bv] = [aValue.value?.[0], bValue.value?.[0]];

        const [d1, d2] = [
          av ? parse(av, DATE_FORMAT, new Date()).getTime() : 0,
          bv ? parse(bv, DATE_FORMAT, new Date()).getTime() : 0,
        ];

        return d1 - d2;
      };
    case 'DatesPairCollection':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original.attrs[columnId], b.original.attrs[columnId]];
        if (!aValue || !bValue) return 0;
        if (aValue.type !== 'DatePairVec' || bValue.type !== 'DatePairVec') {
          return 0;
        }

        const [av, bv] = [aValue.value?.[0]?.started, bValue.value?.[0]?.started];

        const [d1, d2] = [
          av ? parse(av, DATE_FORMAT, new Date()).getTime() : 0,
          bv ? parse(bv, DATE_FORMAT, new Date()).getTime() : 0,
        ];

        return d1 - d2;
      };
  }

  return () => 0;
};

export const attrValueToStringForFuzzyFiltering = (value?: AttrValue) => {
  if (!value) return '';
  if (value.type === 'String') return value.value;
  if (value.type === 'StringVec') return value.value?.join(' ') ?? '';
  if (value.type === 'Float') return String(value.value);
  if (value.type === 'Integer') return String(value.value);
  /** Not handling others yet, will likely implement proper filters for them later */
  return '';
};
