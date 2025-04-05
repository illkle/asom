import type { SortingFn, SortingFnOption } from '@tanstack/vue-table';
import { parse } from 'date-fns';
import type { AttrValue, SchemaItem } from '~/types';
export type TableRowType = {
  path: string | null;
} & {
  [key: string]: AttrValue;
};

export const getSortFunction = (
  type: SchemaItem['value']['type'],
): SortingFn<TableRowType> | SortingFnOption<TableRowType> => {
  switch (type) {
    case 'Text':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original[columnId], b.original[columnId]];
        if (aValue.type !== 'String' || bValue.type !== 'String') {
          return 0;
        }
        return (aValue.value ?? '').localeCompare(bValue.value ?? '');
      };
    case 'Date':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original[columnId], b.original[columnId]];
        if (aValue.type !== 'String' || bValue.type !== 'String') {
          return 0;
        }

        const [d1, d2] = [
          aValue.value ? parse(aValue.value ?? '', 'yyyy-MM-dd', new Date()).getTime() : 0,
          bValue.value ? parse(bValue.value ?? '', 'yyyy-MM-dd', new Date()).getTime() : 0,
        ];

        return d1 - d2;
      };
    case 'Number':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original[columnId], b.original[columnId]];
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
        const [aValue, bValue] = [a.original[columnId], b.original[columnId]];
        if (aValue.type !== 'StringVec' || bValue.type !== 'StringVec') {
          return 0;
        }

        return (aValue.value?.[0] ?? '').localeCompare(bValue.value?.[0] ?? '');
      };
    case 'DateCollection':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original[columnId], b.original[columnId]];
        if (aValue.type !== 'StringVec' || bValue.type !== 'StringVec') {
          return 0;
        }

        const [av, bv] = [aValue.value?.[0], bValue.value?.[0]];

        const [d1, d2] = [
          av ? parse(av, 'yyyy-MM-dd', new Date()).getTime() : 0,
          bv ? parse(bv, 'yyyy-MM-dd', new Date()).getTime() : 0,
        ];

        return d1 - d2;
      };
    case 'DatesPairCollection':
      return (a, b, columnId) => {
        const [aValue, bValue] = [a.original[columnId], b.original[columnId]];
        if (aValue.type !== 'DatePairVec' || bValue.type !== 'DatePairVec') {
          return 0;
        }

        const [av, bv] = [aValue.value?.[0].started, bValue.value?.[0].started];

        const [d1, d2] = [
          av ? parse(av, 'yyyy-MM-dd', new Date()).getTime() : 0,
          bv ? parse(bv, 'yyyy-MM-dd', new Date()).getTime() : 0,
        ];

        return d1 - d2;
      };
  }

  return () => 0;
};
