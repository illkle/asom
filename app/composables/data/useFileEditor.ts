import { rename } from '@tauri-apps/plugin-fs';
import { watchPausable } from '@vueuse/core';
import { cloneDeep, throttle } from 'lodash-es';
import path from 'path-browserify';
import type { ShallowRef } from 'vue';

import { c_read_file_by_path, c_save_file } from '~/api/tauriActions';
import { useCodeMirror } from '~/composables/CodeMirror/useCodeMirror';
import { useTabsStoreV2, type IOpened } from '~/composables/stores/useTabsStoreV2';

const useSyncedValue = <T>({
  remoteValue,
  getTimestamp,
  updater,
  changesTracker,
  onExternalUpdate,
  skipFirstUpdate = false,
}: {
  remoteValue: Ref<T>;
  skipFirstUpdate?: boolean;
  getTimestamp: (v: T) => Date;
  updater: (v: T) => Promise<Date>;
  onExternalUpdate: (v: T) => void;
  changesTracker: Ref<number>;
}) => {
  const editableProxy = ref(remoteValue.value);
  const lastSyncedTimestamp = ref(getTimestamp(remoteValue.value));

  const skipUpdate = ref(skipFirstUpdate);

  watch(remoteValue, (v) => {
    const newTs = getTimestamp(v);

    if (newTs > lastSyncedTimestamp.value) {
      pauseWatcher();
      editableProxy.value = v;
      lastSyncedTimestamp.value = newTs;
      onExternalUpdate(v);
      resumeWatcher();
    }
  });

  const { pause: pauseWatcher, resume: resumeWatcher } = watchPausable(
    editableProxy,
    () => {
      if (skipUpdate.value) {
        console.log('skipUpdate++');
        skipUpdate.value = false;
        return;
      }
      console.log('changesTracker++');
      changesTracker.value++;
    },
    { deep: true },
  );

  const performUpdate = async () => {
    try {
      const stateToSave = cloneDeep(editableProxy.value);
      const changesCopy = changesTracker.value;
      const newTimestamp = await updater(stateToSave);
      lastSyncedTimestamp.value = newTimestamp;
      changesTracker.value -= changesCopy;
    } catch (e) {
      console.error(e);
    }
  };

  return { editableProxy, performUpdate, lastSyncedTimestamp, pauseWatcher, resumeWatcher };
};

export const OPENED_FILE_KEY = (opened: IOpened) => ['files', opened._type, opened._path];

export const useFileEditorV2 = (
  opened: IOpened,
  editorTemplateRef: Readonly<ShallowRef<HTMLDivElement | null>>,
) => {
  const fileQ = useQuery({
    key: OPENED_FILE_KEY(opened),
    query: () => {
      return c_read_file_by_path(opened._path);
    },
  });

  useListenToEvent('FileUpdate', async (v) => {
    if (v.c.path === opened._path) {
      await fileQ.refetch();
    }
  });

  watch(fileQ.data, (v) => {
    if (v?.parsing_error) {
      useRustErrorNotification(v.parsing_error);
    }
  });

  const schemaPath = computed(() => fileQ.data.value?.schema.owner_folder ?? '');

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

  const { editableProxy, performUpdate, lastSyncedTimestamp, pauseWatcher, resumeWatcher } =
    useSyncedValue({
      changesTracker,
      remoteValue: fileQ.data,
      getTimestamp: (v) => new Date(v?.record.modified ?? 0),
      onExternalUpdate: (v) => {
        createOrUpdateEditor(v?.record.markdown ?? '');
      },
      skipFirstUpdate: true,
      updater: async (v) => {
        console.log('updater', v);
        if (!v) throw new Error('No value to save');

        const data = v.record;
        data.markdown = getEditorState();
        const res = await c_save_file(data, true);
        return new Date(res.modified);
      },
    });

  const { getEditorState, createOrUpdateEditor } = useCodeMirror({
    editorTemplateRef,
    onChange: () => {
      changesTracker.value++;
    },
  });

  onMounted(() => {
    createOrUpdateEditor(fileQ.data.value?.record.markdown || '');
  });

  const throrottledUpdate = throttle(performUpdate, 2000);

  watch(changesTracker, (v) => {
    if (v > 0) {
      console.log('throrottledUpdate');
      throrottledUpdate();
    }
  });

  onBeforeUnmount(async () => {
    await throrottledUpdate.flush();
  });

  const ts = useTabsStoreV2();

  const onRename = async (newName: string) => {
    const np = path.join(path.dirname(opened._path), newName + '.md');

    ts._markPathAsIgnoredForDeletion(opened._path);

    await performUpdate();
    pauseWatcher();
    await rename(opened._path, np);

    await listenOnce('FileAdd', (e) => {
      if (e.c.path === np) {
        ts._handlePathRename(opened._path, np);
        ts._unmarkPathAsIgnoredForDeletion(opened._path);
        resumeWatcher();
      }
    });
  };

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
  };
};
