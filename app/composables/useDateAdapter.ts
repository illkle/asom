import { CalendarDate, type DateValue } from '@internationalized/date';
import { format, parse } from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd';

export const fileStringToDate = (dateString: string | undefined | null) => {
  if (!dateString) return undefined;

  const dd = parse(dateString, DATE_FORMAT, new Date());
  if (isNaN(dd.getTime())) {
    throw new Error('Invalid date');
  }
  return new CalendarDate(dd.getFullYear(), dd.getMonth() + 1, dd.getDate());
};

export const dateToFileString = (date: DateValue) => {
  return format(new Date(date.year, date.month - 1, date.day), DATE_FORMAT);
};
export const jsDateToFileString = (date: Date) => {
  return format(date, DATE_FORMAT);
};

/**
 * Exposes date value as string but returns mutable date value
 * @returns
 */
export const useDateAdapterModel = (modelValue: Ref<string | null>) => {
  const dateModel = computed({
    get: () => {
      try {
        return fileStringToDate(modelValue.value ?? undefined);
      } catch (e) {
        console.error('error parsing date', e);
        return undefined;
      }
    },
    set: (v) => {
      modelValue.value = v ? dateToFileString(v) : null;
    },
  });

  return {
    dateModel,
  };
};
