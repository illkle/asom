import { debounce as _debounce, throttle } from 'lodash';
import { cloneDeep as _cloneDeep } from 'lodash';

import type { IOpenedPath } from '~/api/openedTabs';

import { rustErrorNotification, useListenToEvent } from '~/api/tauriEvents';
import { useThrottledEvents } from '~/utils/useTrottledEvents';
import path from 'path-browserify';
import { c_get_files_path, returnErrorHandler } from '~/api/tauriActions';
import type { BookFromDb } from '~/types';

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

  const loadContent = async () => {
    loading.value = true;
    if (opened.type === 'folder') {
      const res = await c_get_files_path(opened.thing, searchQuery.value).catch(returnErrorHandler);
      if ('isError' in res) {
        rustErrorNotification(res, {});
        return;
      }
      data.value = res;
    }

    nextTick(() => {
      loading.value = false;
      if (onLoaded) {
        onLoaded();
      }
    });
  };

  onMounted(() => {
    loadContent();
  });

  watch(searchQuery, () => {
    loadContent();
  });

  //
  // Update event handling
  //
  const updateOrAddToFiles = (book: BookFromDb) => {
    if (!data.value) return;
    const books = data.value.books;
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
    const books = data.value.books;
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

  useListenToEvent('FileAdd', (book) => onEvent({ event: 'add', book }));
  useListenToEvent('FileUpdate', (book) => onEvent({ event: 'update', book }));
  useListenToEvent('FileRemove', (path) => onEvent({ event: 'remove', path }));

  // For folder events we just reload everything because it can modify a lot of sub-files\sub-dirs
  useListenToEvent('FolderAdd', (v) => {
    if (opened.type !== 'folder' || isChangedFolderRelevant(opened.thing, v.path))
      processQueue(true);
  });
  useListenToEvent('FolderRemove', (v) => {
    if (opened.type !== 'folder' || isChangedFolderRelevant(opened.thing, v.path))
      processQueue(true);
  });

  return { data, loading };
};

const isChangedFolderRelevant = (myPath: string, eventPath: string) => {
  const relative = path.relative(myPath, eventPath);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
};

type FileListEvent =
  | {
      event: 'add';
      book: BookFromDb;
    }
  | {
      event: 'update';
      book: BookFromDb;
    }
  | {
      event: 'remove';
      path: string;
    };
