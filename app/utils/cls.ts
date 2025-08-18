import { twMerge } from 'tailwind-merge';
import { cx } from 'cva';
import type { Updater } from '@tanstack/vue-table';

// Merges classes while removing tailwind conflicts
// 'p-2 mt-4 p-4' => 'mt-4 p-4'
export function cls(...classes: (string | boolean)[]) {
  return twMerge(cx(...classes));
}

export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
  ref.value = typeof updaterOrValue === 'function' ? updaterOrValue(ref.value) : updaterOrValue;
}

export default cls;
