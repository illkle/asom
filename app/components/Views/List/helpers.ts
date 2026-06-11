import type { SortingFn } from '@tanstack/vue-table';
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

export const compareRecordsByType = (
  type: SchemaItem['value']['type'],
  a: RecordFromDb,
  b: RecordFromDb,
  columnId: string,
) => {
  switch (type) {
    case 'Text': {
      const [aValue, bValue] = [a.attrs[columnId], b.attrs[columnId]];
      if (!aValue || !bValue) return 0;
      if (aValue.type !== 'String' || bValue.type !== 'String') {
        return 0;
      }
      return (aValue.value ?? '').localeCompare(bValue.value ?? '');
    }
    case 'Date': {
      const [aValue, bValue] = [a.attrs[columnId], b.attrs[columnId]];
      if (!aValue || !bValue) return 0;
      if (aValue.type !== 'String' || bValue.type !== 'String') {
        return 0;
      }

      const [d1, d2] = [
        aValue.value ? parse(aValue.value ?? '', DATE_FORMAT, new Date()).getTime() : 0,
        bValue.value ? parse(bValue.value ?? '', DATE_FORMAT, new Date()).getTime() : 0,
      ];

      return d1 - d2;
    }
    case 'Number': {
      const [aValue, bValue] = [a.attrs[columnId], b.attrs[columnId]];
      if (!aValue || !bValue) return 0;
      if (
        (aValue.type !== 'Float' && aValue.type !== 'Integer') ||
        (bValue.type !== 'Float' && bValue.type !== 'Integer')
      ) {
        return 0;
      }

      return (aValue.value ?? 0) - (bValue.value ?? 0);
    }
    case 'TextCollection': {
      const [aValue, bValue] = [a.attrs[columnId], b.attrs[columnId]];
      if (!aValue || !bValue) return 0;
      if (aValue.type !== 'StringVec' || bValue.type !== 'StringVec') {
        return 0;
      }

      return (aValue.value?.[0] ?? '').localeCompare(bValue.value?.[0] ?? '');
    }
    case 'DateCollection': {
      const [aValue, bValue] = [a.attrs[columnId], b.attrs[columnId]];
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
    }
    case 'DatesPairCollection': {
      const [aValue, bValue] = [a.attrs[columnId], b.attrs[columnId]];
      if (!aValue || !bValue) return 0;
      if (aValue.type !== 'DatePairVec' || bValue.type !== 'DatePairVec') {
        return 0;
      }

      const [av, bv] = [
        aValue.value?.[0]?.finished ?? aValue.value?.[0]?.started,
        bValue.value?.[0]?.finished ?? bValue.value?.[0]?.started,
      ];

      const [d1, d2] = [
        av ? parse(av, DATE_FORMAT, new Date()).getTime() : 0,
        bv ? parse(bv, DATE_FORMAT, new Date()).getTime() : 0,
      ];

      return d1 - d2;
    }
  }

  return 0;
};

export const getSortFunction = (type: SchemaItem['value']['type']): SortingFn<RecordFromDb> => {
  return (a, b, columnId) => compareRecordsByType(type, a.original, b.original, columnId);
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
