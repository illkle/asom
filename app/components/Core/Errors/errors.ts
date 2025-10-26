import { toast } from 'vue-sonner';
import ErrorToast from '~/components/Core/Errors/ErrorToast.vue';

import { useListenToEvent } from '~/composables/useListenToEvent';
import type { ErrFR, ErrFRActionCode } from '~/types';

export function isOurError(v: unknown): v is ErrFR {
  return Boolean(v && typeof v === 'object' && 'isError' in v && v.isError === true);
}

export type CodeBindsForError = Partial<Record<ErrFRActionCode, () => void>>;

/** Used to handle error when it might come from us or from unknown source */
export const handleMaybeOurError = ({
  e,
  codeBinds,
}: {
  e: unknown;
  codeBinds?: CodeBindsForError;
}) => {
  console.error(e);
  if (!isOurError(e)) {
    handleExternalErrorWithNotification(e);
    return;
  }
  handleOurErrorWithNotification(e, codeBinds);
};

export const handleExternalErrorWithNotification = (
  e: unknown,
  custom?: { title?: string; info?: string; rawError?: string },
) => {
  if (e instanceof Error) {
    console.error(e);
    console.error('handleExternalErrorWithNotification 111');
    handleOurErrorWithNotification({
      isError: true,
      title: 'Error occurred',
      info: e.message,
      rawError: e.stack,
      subErrors: [],
      ...custom,
    });
    return;
  }
  handleOurErrorWithNotification({
    rawError: String(e),
    isError: true,
    title: 'Unknown external error',
    subErrors: [],
  });
};

/** Used to display error notification */
export const handleOurErrorWithNotification = (
  e: ErrFR,
  codeBinds?: Partial<Record<ErrFRActionCode, () => void>>,
) => {
  toast.error(e.title, {
    description: markRaw(ErrorToast),
    componentProps: {
      err: e,
    },
    duration: 30000, // ms
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
  useListenToEvent('ErrorHappened', (v) => handleOurErrorWithNotification(v.c));
};
