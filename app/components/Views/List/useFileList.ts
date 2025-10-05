import { c_get_files_by_path } from '~/api/tauriActions';
import type { IOpened } from '~/composables/stores/useTabsStoreV2';
import { useListenToEvent } from '~/composables/useListenToEvent';
import { useThrottledEvents } from '~/composables/useTrottledEvents';
import type {
  FileEventDataExisting,
  FileEventDataRemoved,
  FolderEventData,
  FolderEventDataExisting,
  RecordFromDb,
  RecordListGetResult,
  SchemaLocation,
} from '~/types';

export const FILES_LIST_KEY = (opened: IOpened) => ['files', opened._type, opened._path];

export const useFilesListV2 = ({ opened }: { opened: IOpened }) => {
  const files = useQuery({
    key: () => FILES_LIST_KEY(opened),
    query: async () => {
      const res = await c_get_files_by_path(opened._path);
      return res;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const qc = useQueryCache();

  //
  // Update event handling
  //

  const invalidateFiles = () => {
    qc.invalidateQueries({
      key: ['files', opened._type, opened._path],
    });
  };

  const processEvents = (e: FileListEvent[]) => {
    const paths = new Set<string>();

    const toUpdate: Record<string, RecordFromDb> = {};
    const toDelete: Set<string> = new Set();
    const toAdd: RecordFromDb[] = [];

    for (const event of e) {
      if (paths.has(event.data.path)) {
        console.warn('useFileList: duplicate path event', event.data.path);
        // Events can be out of order, so we just invalidate everything on duplicate paths. This should happen rarely.
        invalidateFiles();
        return;
      }
      paths.add(event.data.path);

      if (event.event === 'add') {
        toAdd.push(event.data.record);
      } else if (event.event === 'update') {
        toUpdate[event.data.path] = event.data.record;
      } else if (event.event === 'remove') {
        toDelete.add(event.data.path);
      }
    }

    const existingData = qc.getQueryData<RecordListGetResult>(FILES_LIST_KEY(opened));

    if (!existingData) {
      invalidateFiles();
      console.warn('useFileList: trying to process events without existing data');
      return;
    }

    const newData = {
      ...existingData,
      records: existingData.records
        .filter((v) => v.path && !toDelete.has(v.path))
        .map((v) => (v.path && toUpdate[v.path] ? toUpdate[v.path] : v))
        .concat(toAdd),
    };

    qc.setQueryData(FILES_LIST_KEY(opened), newData);
  };

  const { onEvent, processQueue } = useThrottledEvents(
    processEvents,
    () => invalidateFiles(),
    250,
    15,
  );

  useListenToEvent(
    'FileAdd',
    (v) => onEvent({ event: 'add', data: v.c }),
    (e) =>
      isExistingEventRelevant({
        currentPath: opened._path,
        currentSchema: files.data.value?.schema.location,
        event: e.c,
      }),
  );
  useListenToEvent(
    'FileUpdate',
    (v) => onEvent({ event: 'update', data: v.c }),
    (e) =>
      isExistingEventRelevant({
        currentPath: opened._path,
        currentSchema: files.data.value?.schema.location,
        event: e.c,
      }),
  );
  useListenToEvent(
    'FileRemove',
    (v) => onEvent({ event: 'remove', data: v.c }),
    (e) =>
      isExistingEventRelevant({
        currentPath: opened._path,
        currentSchema: files.data.value?.schema.location,
        event: e.c,
      }),
  );

  // For folder events we just reload everything because it can modify a lot of sub-files\sub-dirs
  useListenToEvent(
    'FolderAdd',
    () => processQueue(true),
    (e) =>
      isExistingEventRelevant({
        currentPath: opened._path,
        currentSchema: files.data.value?.schema.location,
        event: e.c,
      }),
  );
  useListenToEvent(
    'FolderRemove',
    () => processQueue(true),
    (e) =>
      isExistingEventRelevant({
        currentPath: opened._path,
        currentSchema: files.data.value?.schema.location,
        event: e.c,
      }),
  );

  return { files };
};

const isExistingEventRelevant = async ({
  currentPath,
  currentSchema,
  event,
}: {
  currentPath: string;
  currentSchema?: SchemaLocation;
  event: FolderEventData | FileEventDataExisting | FolderEventDataExisting;
}) => {
  return Boolean(
    currentSchema &&
      event.schema?.schema_path === currentSchema.schema_path &&
      event.path.startsWith(currentPath),
  );
};

type FileListEvent =
  | {
      event: 'add';
      data: FileEventDataExisting;
    }
  | {
      event: 'update';
      data: FileEventDataExisting;
    }
  | {
      event: 'remove';
      data: FileEventDataRemoved;
    };
