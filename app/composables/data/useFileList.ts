import path from 'path-browserify';
import { c_get_files_path } from '~/api/tauriActions';
import type { IOpened } from '~/composables/stores/useTabsStoreV2';
import { useListenToEvent } from '~/composables/useListenToEvent';
import { useRustErrorNotification } from '~/composables/useRustErrorNotifcation';
import { useThrottledEvents } from '~/composables/useTrottledEvents';
import type { RecordFromDb, RecordListGetResult, SortOrder } from '~/types';

export const FILES_LIST_KEY = (opened: IOpened, searchQuery: string, sort: SortOrder) => [
  'files',
  opened._type,
  opened._path,
  searchQuery,
  sort.key,
  sort.descending ? 'desc' : 'asc',
];

export const useFlesListV2 = ({
  opened,
  searchQuery,
  sort,
}: {
  opened: IOpened;
  searchQuery: Ref<string>;
  sort: Ref<SortOrder>;
}) => {
  const files = useQuery({
    key: () => FILES_LIST_KEY(opened, searchQuery.value, sort.value),
    query: () => c_get_files_path(opened._path, searchQuery.value, sort.value),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const filesMemo = ref<RecordListGetResult | undefined>(undefined);

  watch(
    files.data,
    (v) => {
      if (v) {
        filesMemo.value = v;
      }
    },
    { immediate: true },
  );

  watch(files.error, (e) => {
    if (e && isOurError(e)) {
      useRustErrorNotification(e, {});
    }
  });

  const qc = useQueryCache();

  //
  // Update event handling
  //
  const updateOrAddToFiles = () => {
    qc.invalidateQueries({
      key: ['files', opened._type, opened._path],
    });
  };

  const removeFromFiles = () => {
    qc.invalidateQueries({
      key: ['files', opened._type, opened._path],
    });
  };

  const processEvent = (e: FileListEvent) => {
    switch (e.event) {
      case 'add':
        updateOrAddToFiles();
        break;
      case 'remove':
        removeFromFiles();
        break;
      case 'update':
        updateOrAddToFiles();
        break;
    }
  };

  const processEvents = (e: FileListEvent[]) => {
    e.forEach(processEvent);
  };

  const { onEvent, processQueue } = useThrottledEvents(
    processEvents,
    () => void files.refetch(),
    250,
    15,
  );

  useListenToEvent(
    'FileAdd',
    (v) => onEvent({ event: 'add', book: v.c }),
    (v) => (v.c.path ? isChangeRelevant(opened._path, v.c.path) : false),
  );
  useListenToEvent(
    'FileUpdate',
    (v) => onEvent({ event: 'update', book: v.c }),
    (v) => (v.c.path ? isChangeRelevant(opened._path, v.c.path) : false),
  );
  useListenToEvent(
    'FileRemove',
    (v) => onEvent({ event: 'remove', path: v.c }),
    (v) => isChangeRelevant(opened._path, v.c),
  );

  // For folder events we just reload everything because it can modify a lot of sub-files\sub-dirs
  useListenToEvent(
    'FolderAdd',
    (v) => processQueue(true),
    (v) => (v.c.path ? isChangeRelevant(opened._path, v.c.path) : false),
  );
  useListenToEvent(
    'FolderRemove',
    (v) => processQueue(true),
    (v) => (v.c.path ? isChangeRelevant(opened._path, v.c.path) : false),
  );

  return { files, filesMemo };
};

/**
 * Returns true if the event is relevant to the target path.
 * Event is relevat if it's path is inside of target path.
 * NOTE: This is made for current logic where opening folder means getting files inside it recursively.
 */
const isChangeRelevant = (targetPath: string, eventPath: string) => {
  console.log('isChangeRelevant', targetPath, eventPath);
  const normalizedCurrent = path.normalize(targetPath);
  const normalizedEvent = path.normalize(eventPath);

  if (normalizedCurrent === normalizedEvent) return true;

  const relative = path.relative(normalizedCurrent, normalizedEvent);
  return !relative.startsWith('..') && relative !== '';
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
