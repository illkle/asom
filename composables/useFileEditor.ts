import { watchPausable } from '@vueuse/core';
import { cloneDeep, throttle } from 'lodash-es';
import type { ShallowRef } from 'vue';

import { c_read_file_by_path, c_save_file } from '~/api/tauriActions';
import { useCodeMirror } from '~/composables/CodeMirror/useCodeMirror';
import type { IOpenedFile } from '~/composables/stores/useTabsStoreV2';

const useSyncedValue = <T>({
  remoteValue,
  getTimestamp,
  updater,
  changesTracker,
  onExternalUpdate,
}: {
  remoteValue: Ref<T>;
  getTimestamp: (v: T) => Date;
  updater: (v: T) => Promise<Date>;
  onExternalUpdate: (v: T) => void;
  changesTracker: Ref<number>;
}) => {
  const editableProxy = ref(remoteValue.value);
  const lastSyncedTimestamp = ref(getTimestamp(remoteValue.value));

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
      changesTracker.value++;
    },
    { deep: true },
  );

  const performUpdate = async () => {
    console.log('performUpdate');
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

  return { editableProxy, performUpdate, lastSyncedTimestamp };
};

export const OPENED_FILE_KEY = (opened: IOpenedFile) => ['files', opened._type, opened._path];

export const useFileEditorV2 = (
  opened: IOpenedFile,
  editorTemplateRef: Readonly<ShallowRef<HTMLDivElement | null>>,
) => {
  const fileQ = useQuery({
    key: OPENED_FILE_KEY(opened),
    query: () => c_read_file_by_path(opened._path),
  });

  useListenToEvent('FileUpdate', async (v) => {
    if (v.c.path === opened._path) {
      await fileQ.refetch();
    }
  });

  const schemaPath = computed(() => fileQ.data.value?.schema.owner_folder ?? '');

  const { q: viewSettingsQ, viewSettingsUpdater } = useViewSettings(schemaPath);

  const { q: viewLayoutQ, update: updateViewLayout } = useViewLayout(schemaPath);

  const changesTracker = ref(0);

  const { editableProxy, performUpdate, lastSyncedTimestamp } = useSyncedValue({
    changesTracker,
    remoteValue: fileQ.data,
    getTimestamp: (v) => new Date(v?.record.modified ?? 0),
    onExternalUpdate: (v) => {
      createOrUpdateEditor(v?.record.markdown ?? '');
    },
    updater: async (v) => {
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
      throrottledUpdate();
    }
  });

  onBeforeUnmount(async () => {
    await throrottledUpdate.flush();
  });

  return {
    fileQ,
    editableProxy,
    performUpdate,
    viewSettingsQ,
    viewSettingsUpdater,
    viewLayoutQ,
    updateViewLayout,
    changesTracker,
    lastSyncedTimestamp,
  };
};
