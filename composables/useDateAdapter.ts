import { CalendarDate, type DateValue } from '@internationalized/date';
import { format, parse } from 'date-fns';
import { useSettingsStore } from '~/composables/stores/useSettingsStore';

export const useDateHooks = () => {
  const s = useSettingsStore();

  const stringToDate = (dateString: string | undefined) => {
    if (!dateString) return undefined;

    if (!s.settings) {
      throw new Error('No settings loaded');
    }

    const dd = parse(dateString, s.settings.dateFormat, new Date());
    return new CalendarDate(dd.getFullYear(), dd.getMonth() + 1, dd.getDate());
  };

  const dateToString = (date: DateValue) => {
    if (!s.settings) {
      throw new Error('No settings loaded');
    }
    return format(new Date(date.year, date.month - 1, date.day), s.settings.dateFormat);
  };

  return {
    stringToDate,
    dateToString,
  };
};

/**
 * Exposes date value as string but returns mutable date value
 * @returns
 */
export const useDateAdapterModel = (modelValue: Ref<string | undefined>) => {
  const { stringToDate, dateToString } = useDateHooks();

  const dateModel = computed({
    get: () => stringToDate(modelValue.value),
    set: (v) => {
      modelValue.value = v ? dateToString(v) : undefined;
    },
  });

  return {
    dateModel,
  };
};
