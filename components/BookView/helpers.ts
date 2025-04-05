import type { SortingFn } from '@tanstack/vue-table';
import { parse } from 'date-fns';
import type { AttrValue, SchemaItem } from '~/types';
export type TableRowType = {
  path: string | null;
} & {
  [key: string]: AttrValue;
};

const getSortFunction = (type: SchemaItem['value']['type']): SortingFn<TableRowType> => {
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
          !['Float', 'Integer'].includes(aValue.type) ||
          !['Float', 'Integer'].includes(bValue.type)
        ) {
          return 0;
        }

        return (aValue.value ?? 0) - (bValue.value ?? 0);
      };
  }

  return (a, b) => 0;
};
