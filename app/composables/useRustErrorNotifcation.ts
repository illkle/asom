import { markRaw } from 'vue';
import { toast } from 'vue-sonner';

import ErrorToast from '~/components/Modules/Error/ErrorToast.vue';
import { useListenToEvent } from '~/composables/useListenToEvent';
import type { ErrFR, ErrFRActionCode } from '~/types';

export function isOurError(v: unknown): v is ErrFR {
  return Boolean(v && typeof v === 'object' && 'isError' in v && v.isError === true);
}

export const useRustErrorNotification = (
  e: ErrFR,
  codeBinds?: Partial<Record<ErrFRActionCode, () => void>>,
) => {
  console.log('e', e);
  toast.error(e.title, {
    description: markRaw(ErrorToast),
    componentProps: {
      err: e,
    },

    duration: Infinity,
    closeButton: true,
    action:
      codeBinds && e.actionCode
        ? {
            onClick: codeBinds[e.actionCode],
            label: e.actionLabel || 'Retry',
          }
        : undefined,
  });
};

export const useHandleErrorsFromRust = () => {
  useListenToEvent('ErrorHappened', (v) => useRustErrorNotification(v.c));
};
