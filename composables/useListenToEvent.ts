import { listen, type UnlistenFn } from '@tauri-apps/api/event';

import type { ExtractIPCEmitEventData, IPCEmitEvent } from '~/types';

export const useListenToEvent = <E extends IPCEmitEvent['type']>(
  name: E,
  callback: (v: { t: E; c: ExtractIPCEmitEventData<E> }) => void | Promise<void>,
) => {
  const u = ref<UnlistenFn>();

  onMounted(async () => {
    u.value = await listen(name, (event) => {
      callback(event.payload as { t: E; c: ExtractIPCEmitEventData<E> });
    });
  });

  onBeforeUnmount(async () => {
    if (u.value) {
      await u.value();
    }
  });
};
