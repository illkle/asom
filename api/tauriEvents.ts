import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { IBookFromDb } from '~/api/watcher/metaCache';

type EventPayloads = {
  file_remove: string;
  file_add: IBookFromDb;
  file_update: IBookFromDb;
  folder_add: string;
  folder_remove: string;
};

export const useListenToEvent = <E extends keyof EventPayloads>(
  name: E,
  callback: (v: EventPayloads[E]) => void | Promise<void>,
) => {
  const u = ref<UnlistenFn>();

  onMounted(async () => {
    const a = await listen(name, (event) => {
      callback(event.payload as EventPayloads[E]);
    });
  });

  onBeforeUnmount(async () => {
    if (u.value) {
      await u.value();
    }
  });
};
