import { listen, type UnlistenFn } from '@tauri-apps/api/event';

import type { ExtractIPCEmitEventData, IPCEmitEvent } from '~/types';

export const useListenToEvent = <E extends IPCEmitEvent['type']>(
  name: E,
  callback: (v: { t: E; c: ExtractIPCEmitEventData<E> }) => void | Promise<void>,
  condition?: (v: { t: E; c: ExtractIPCEmitEventData<E> }) => boolean | Promise<boolean>,
) => {
  const u = ref<UnlistenFn>();

  onMounted(async () => {
    u.value = await listen(name, async (event) => {
      console.log('listenToEvent', event);
      if (
        condition &&
        !(await condition(event.payload as { t: E; c: ExtractIPCEmitEventData<E> }))
      ) {
        return;
      }
      callback(event.payload as { t: E; c: ExtractIPCEmitEventData<E> });
    });
  });

  onBeforeUnmount(async () => {
    if (u.value) {
      try {
        await u.value();
      } catch (e) {
        console.error('Error unlistening to event', e);
      }
    }
  });
};

export const listenOnce = async <E extends IPCEmitEvent['type']>(
  name: E,
  callback: (v: { t: E; c: ExtractIPCEmitEventData<E> }) => void | Promise<void>,
) => {
  const wrapedCallback = (data: { t: E; c: ExtractIPCEmitEventData<E> }) => {
    callback(data);
    unlisten();
  };

  const unlisten = await listen(name, (event) => {
    wrapedCallback(event.payload as { t: E; c: ExtractIPCEmitEventData<E> });
  });
};
