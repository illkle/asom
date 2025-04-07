import path from 'path-browserify';
import { c_get_files_path } from '~/api/tauriActions';
import type { IOpenedPath } from '~/composables/stores/useTabsStore';
import { useListenToEvent } from '~/composables/useListenToEvent';
import { useRustErrorNotification } from '~/composables/useRustErrorNotifcation';
import { useThrottledEvents } from '~/composables/useTrottledEvents';
import type { RecordFromDb } from '~/types';

const FILES_LIST_KEY = (opened: IOpenedPath, searchQuery: string) => [
  'files',
  opened.type,
  opened.thing,
  searchQuery,
];

export const useFlesListV2 = ({
  opened,
  searchQuery,
}: {
  opened: IOpenedPath;
  searchQuery: Ref<string>;
}) => {
  const files = useQuery({
    key: () => FILES_LIST_KEY(opened, searchQuery.value),
    query: () => c_get_files_path(opened.thing, searchQuery.value),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  watch(files.error, (e) => {
    if (e && isOurError(e)) {
      useRustErrorNotification(e, {});
    }
  });

  const qc = useQueryCache();

  //
  // Update event handling
  //
  const updateOrAddToFiles = (book: RecordFromDb) => {
    const data = qc.getQueryData<Awaited<ReturnType<typeof c_get_files_path>> | null>(
      FILES_LIST_KEY(opened, searchQuery.value),
    );
    if (!data) return;

    const books = data.records;
    // Do not assume that add event will be called once
    // I encountered watcher on mac emitting duplicate events when copying files
    const index = books.findIndex((v) => v.path === book.path);
    if (index >= 0) {
      books[index] = book;
    } else {
      books.push(book);
    }
    qc.setQueryData(FILES_LIST_KEY(opened, searchQuery.value), {
      ...data,
      records: books,
    });
  };

  const removeFromFiles = (path: string) => {
    const data = qc.getQueryData<Awaited<ReturnType<typeof c_get_files_path>> | null>(
      FILES_LIST_KEY(opened, searchQuery.value),
    );
    if (!data) return;

    const books = data.records;
    const index = data.records.findIndex((v) => v.path === path);

    if (index >= 0) {
      books.splice(index, 1);
      qc.setQueryData(FILES_LIST_KEY(opened, searchQuery.value), {
        ...data,
        records: books,
      });
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
    console.log('processEvents', e);
    e.forEach(processEvent);
  };

  const { onEvent, processQueue } = useThrottledEvents(
    processEvents,
    () => void files.refetch(),
    1000,
    15,
  );

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

  return files;
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
