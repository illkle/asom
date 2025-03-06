import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { toast } from 'solid-sonner';

import ErrorToast from '~/components/Error/ErrorToast.vue';
import type {
  ErrorFromRust,
  ErrorActionCode,
  ExtractIPCEmitEventData,
  IPCEmitEvent,
} from '~/types';

export function isOurError(v: unknown): v is ErrorFromRust {
  return Boolean(
    v && typeof v === 'object' && 'isError' in v && v.isError === true
  );
}

export function isOurErrorReturning(v: unknown) {
  if (isOurError(v)) {
    return v;
  }
  return null;
}

export const rustErrorNotification = (
  e: ErrorFromRust,
  codeBinds?: Partial<Record<ErrorActionCode, () => void>>
) => {
  /*
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
  */
};

/*

export const handleErrorsFromRust = () => {
  useListenToEvent('ErrorHappened', rustErrorNotification);
};

export const useListenToEvent = <E extends IPCEmitEvent['type']>(
  name: E,
  callback: (v: ExtractIPCEmitEventData<E>) => void | Promise<void>
) => {
  const u = ref<UnlistenFn>();

  onMounted(async () => {
    u.value = await listen(name, (event) => {
      callback(event.payload as ExtractIPCEmitEventData<E>);
    });
  });

  onBeforeUnmount(async () => {
    if (u.value) {
      await u.value();
    }
  });
};
*/
