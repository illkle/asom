import type { UseQueryReturn } from '@pinia/colada';
import { path } from '@tauri-apps/api';
import { rename } from '@tauri-apps/plugin-fs';
import { cloneDeep, throttle } from 'lodash-es';
import type { ShallowRef } from 'vue';

import { c_read_file_by_path, c_save_file } from '~/api/tauriActions';
import { useCodeMirror } from '~/composables/CodeMirror/useCodeMirror';
import { useTabsStoreV2, type IOpened } from '~/composables/stores/useTabsStoreV2';

/** Creates editable ref from query data. Allows for two way sync using remote(file) write timestamp to resolve conflicts.
 * Important notes:
 * 1) timestamp from remoteValue\editableProxy will become wrong after we start sending updates. Real timestamp is max(lastSyncedTimestamp, editableProxy['timestampLocation']).
 * 2) this assumes that timestamp on editableProxy is never mutated, we are comparing it on changes to editableProxy to determine if update was made by user or by remote.
 */
export const useSyncedValue = <T>({
  remoteValue,
  getTimestamp,
  setTimestamp,
  getKey,
  updater,
  changesTracker,
  onExternalUpdate,
}: {
  remoteValue: UseQueryReturn<T, Error, T | undefined>;
  getKey: (v: T) => string;
  getTimestamp: (v: T | undefined) => Date;
  setTimestamp: (v: T, ts: Date) => void;
  updater: (v: T) => Promise<Date>;
  onExternalUpdate: (v: T) => void;
  changesTracker: Ref<number>;
}) => {
  const editableProxy = ref<T | null>(null);
  const lastSyncedTimestamp = ref<Date | null>(null);

  watch(
    editableProxy,
    (updatedValue, oldValue) => {
      if (!updatedValue) return;
      if (getTimestamp(updatedValue).getTime() !== getTimestamp(oldValue).getTime()) return;
      if (getKey(updatedValue) !== getKey(oldValue)) return;
      changesTracker.value++;
    },
    { deep: true },
  );

  watch(
    remoteValue.data,
    (remoteUpdate) => {
      if (!remoteUpdate) return;
      const newTs = getTimestamp(remoteUpdate);

      if (lastSyncedTimestamp.value === null || newTs > lastSyncedTimestamp.value) {
        editableProxy.value = remoteUpdate;
        lastSyncedTimestamp.value = newTs;
        onExternalUpdate(remoteUpdate);
      }
    },
    { immediate: true },
  );

  const performUpdate = async () => {
    try {
      const stateToSave = cloneDeep(editableProxy.value);
      if (lastSyncedTimestamp.value) {
        setTimestamp(stateToSave, lastSyncedTimestamp.value);
      }
      const changesCopy = changesTracker.value;
      const newTimestamp = await updater(stateToSave);
      lastSyncedTimestamp.value = newTimestamp;
      changesTracker.value -= changesCopy;
    } catch (e) {
      console.error(e);
    }
  };

  return { editableProxy, performUpdate, lastSyncedTimestamp };
};

export const OPENED_FILE_KEY = (opened: IOpened) => ['files', opened._type, opened._path];

export const useFileEditorV2 = (
  opened: IOpened,
  editorTemplateRef: Readonly<ShallowRef<HTMLDivElement | null>>,
) => {
  const fileQ = useQuery({
    key: OPENED_FILE_KEY(opened),
    query: async () => {
      return await c_read_file_by_path(opened._path);
    },
  });

  useListenToEvent('FileUpdate', async (v) => {
    if (v.c.path === opened._path) {
      await fileQ.refetch();
    }
  });

  watch(fileQ.data, (v) => {
    if (v?.record.parsing_error) {
      handleRustError(v.record.parsing_error);
    }
  });

  const schemaPath = computed(
    () => fileQ.data.value?.record.schema.location.schema_owner_folder ?? '',
  );

  const {
    q: viewSettingsQ,
    m: viewSettingsM,
    partialUpdater: viewSettingsUpdaterPartial,
  } = useViewSettings(schemaPath);

  const {
    q: viewLayoutQ,
    m: viewLayoutM,
    partialUpdater: updateViewLayoutPartial,
  } = useViewLayout(schemaPath);

  const changesTracker = ref(0);

  const { getEditorState, createOrUpdateEditor } = useCodeMirror({
    editorTemplateRef,
    onChange: () => {
      changesTracker.value++;
    },
  });

  const { editableProxy, performUpdate, lastSyncedTimestamp } = useSyncedValue({
    changesTracker,
    remoteValue: fileQ,
    getTimestamp: (v) => new Date(v?.record.record.modified ?? 0),
    setTimestamp: (v, ts) => {
      v.record.record.modified = ts.getTime();
    },
    onExternalUpdate: (v) => {
      createOrUpdateEditor(v?.record.record.markdown ?? '');
    },
    getKey: (v) => v.record.record.path ?? '',
    updater: async (v) => {
      console.log('updater', v);
      if (!v) throw new Error('No value to save');

      const data = v.record;
      data.record.markdown = getEditorState();
      try {
        const res = await c_save_file({ record: data.record });
        return new Date(Number(res.modified));
      } catch (e) {
        handleRustError(e);
        console.error(e);
        throw e;
      }
    },
  });

  const throttledUpdate = throttle(performUpdate, 2000);

  watch(changesTracker, (v) => {
    if (v > 0) {
      throttledUpdate();
    }
  });

  onBeforeUnmount(async () => {
    await throttledUpdate.flush();
  });

  const ts = useTabsStoreV2();

  const onRename = async (newName: string) => {
    const np = await path.join(await path.dirname(opened._path), newName + '.md');

    ts._markPathAsIgnoredForDeletion(opened._path);

    await performUpdate();
    await rename(opened._path, np);

    await listenOnce('FileAdd', (e) => {
      if (e.c.path === np) {
        ts._handlePathRename(opened._path, np);
        ts._unmarkPathAsIgnoredForDeletion(opened._path);
      }
    });
  };

  const somethingPending = computed(() => {
    return fileQ.isPending.value || viewLayoutQ.isPending.value || viewSettingsQ.isPending.value;
  });

  return {
    fileQ,
    editableProxy,
    performUpdate,
    viewSettingsQ,
    viewSettingsM,
    viewSettingsUpdaterPartial,
    viewLayoutQ,
    viewLayoutM,
    updateViewLayoutPartial,
    changesTracker,
    lastSyncedTimestamp,
    onRename,
    somethingPending,
  };
};
