import path from 'path-browserify';
import { c_get_files_path, returnErrorHandler } from '~/api/tauriActions';
import type { IOpenedPath } from '~/composables/stores/useTabsStore';
import { useListenToEvent } from '~/composables/useListenToEvent';
import { useRustErrorNotification } from '~/composables/useRustErrorNotifcation';
import { useThrottledEvents } from '~/composables/useTrottledEvents';
import type { RecordFromDb } from '~/types';

export const useFilesList = ({
  opened,
  onLoaded,
  searchQuery,
}: {
  opened: IOpenedPath;
  onLoaded?: () => void | Promise<void>;
  searchQuery: Ref<string>;
}) => {
  const data = ref<Awaited<ReturnType<typeof c_get_files_path>> | null>(null);

  const loading = ref(true);
  const pending = ref(true);

  const loadContent = async () => {
    loading.value = true;
    if (opened.type === 'folder') {
      const res = await c_get_files_path(opened.thing, searchQuery.value).catch(returnErrorHandler);
      if ('isError' in res) {
        useRustErrorNotification(res, {});
        return;
      }
      data.value = res;
    }
    pending.value = false;
    nextTick(() => {
      loading.value = false;
      if (onLoaded) {
        onLoaded();
      }
    });
  };

  watch(
    [opened, searchQuery],
    () => {
      loadContent();
    },
    { immediate: true },
  );

  //
  // Update event handling
  //
  const updateOrAddToFiles = (book: RecordFromDb) => {
    if (!data.value) return;
    const books = data.value.records;
    // Do not assume that add event will be called once
    // I encountered watcher on mac emitting duplicate events when copying files
    const index = books.findIndex((v) => v.path === book.path);
    if (index >= 0) {
      books[index] = book;
    } else {
      books.push(book);
    }
    triggerRef(data);
  };

  const removeFromFiles = (path: string) => {
    if (!data.value) return;
    const books = data.value.records;
    const index = books.findIndex((v) => v.path === path);

    if (index >= 0) {
      books.splice(index, 1);
      triggerRef(data);
    }
  };

  const processEvent = (e: FileListEvent) => {
    switch (e.event) {
      case 'add':
        updateOrAddToFiles(e.book);
        break;
      case 'remove':
        removeFromFiles(e.path);
        break;
      case 'update':
        updateOrAddToFiles(e.book);
        break;
    }
  };

  const processEvents = (e: FileListEvent[]) => {
    e.forEach(processEvent);
  };

  const { onEvent, processQueue } = useThrottledEvents(processEvents, loadContent, 1000, 15);

  useListenToEvent('FileAdd', (v) => onEvent({ event: 'add', book: v.c }));
  useListenToEvent('FileUpdate', (v) => onEvent({ event: 'update', book: v.c }));
  useListenToEvent('FileRemove', (v) => onEvent({ event: 'remove', path: v.c }));

  // For folder events we just reload everything because it can modify a lot of sub-files\sub-dirs
  useListenToEvent('FolderAdd', (v) => {
    if (opened.type !== 'folder' || isChangedFolderRelevant(opened.thing, v.c.path))
      processQueue(true);
  });
  useListenToEvent('FolderRemove', (v) => {
    if (opened.type !== 'folder' || isChangedFolderRelevant(opened.thing, v.c.path))
      processQueue(true);
  });

  return { data, loading, pending };
};

const isChangedFolderRelevant = (myPath: string, eventPath: string) => {
  const relative = path.relative(myPath, eventPath);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
};

type FileListEvent =
  | {
      event: 'add';
      book: RecordFromDb;
    }
  | {
      event: 'update';
      book: RecordFromDb;
    }
  | {
      event: 'remove';
      path: string;
    };
