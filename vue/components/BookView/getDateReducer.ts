import { parse } from 'date-fns';
import type { DateRead } from '~/types';

type IDateReducer = (acc: null | Date, datePair: DateRead) => null | Date;

export const getDateReducerSingle = (last: boolean, format: string): IDateReducer => {
  return (acc, datePair) => {
    if (!datePair.finished) return acc;

    const finishedDate = parse(datePair.finished, format, new Date());

    if (acc === null) return finishedDate;

    if (last) {
      return finishedDate > acc ? finishedDate : acc;
    }
    return finishedDate < acc ? finishedDate : acc;
  };
};

export const dateReducerAllYears = (format: string) => {
  const f = (acc: number[], datePair: DateRead): number[] => {
    if (!datePair.finished) return acc;

    const finishedDate = parse(datePair.finished, format, new Date());

    acc.push(finishedDate.getFullYear());
    return acc;
  };

  return f;
};
