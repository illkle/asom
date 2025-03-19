import { watchPausable } from '@vueuse/core';
import { throttle } from 'lodash';
import type { ShallowRef } from 'vue';

import type { IOpenedFile } from '~/api/openedTabs';
import { c_read_file_by_path, c_save_file, returnErrorHandler } from '~/api/tauriActions';
import { useRustErrorNotification } from '~/composables/useRustErrorNotifcation';
import { useCodeMirror } from '~/components/Editor/CodeMirror/useCodeMirror';
import type { RecordFromDb, Schema } from '~/types';

export const useBookEditor = (
  opened: IOpenedFile,
  editorTemplateRef: Readonly<ShallowRef<HTMLDivElement | null>>,
) => {
  const file = ref<RecordFromDb | null>(null);

  /*
   * We need to trigger saving when user changes something.
   * This means that we need to watch file object for changes(markdown editor is tracked separately too)
   * However we need to exclude changes from loading\saving to avoid infinite loop
   */
  const { pause: pauseWatcher, resume: resumeWatcher } = watchPausable(
    file,
    (v) => {
      changes.value++;
    },
    { deep: true },
  );

  const schema = ref<Schema | null>(null);

  const error = ref<String | null>(null);

  const { getEditorState, changes, createOrUpdateEditor } = useCodeMirror(editorTemplateRef);

  const loadFileFromDisk = async () => {
    if (opened.type !== 'file') return;
    const res = await c_read_file_by_path(opened.thing).catch(returnErrorHandler);

    if ('isError' in res) {
      useRustErrorNotification(res, {
        FileReadRetry: () => loadFileFromDisk(),
      });
      return;
    }

    if (res.parsing_error) {
      useRustErrorNotification(res.parsing_error);
    }

    pauseWatcher();
    schema.value = res.schema;
    file.value = res.record;
    createOrUpdateEditor(res.record.markdown || '');
    await nextTick();
    resumeWatcher();
  };

  watchEffect(async () => {
    if (opened.type === 'file') {
      await loadFileFromDisk();
    } else {
      file.value = null;
    }
  });

  onMounted(() => {
    createOrUpdateEditor(file.value?.markdown || '');
  });

  const updateHandler = async (update: RecordFromDb) => {
    if (update.modified === file.value?.modified) return;
    await loadFileFromDisk();
  };

  useListenToEvent('FileUpdate', updateHandler);

  const saveFile = async (forced = false) => {
    if (!file.value) return;

    const changesCopy = changes.value;

    if (changesCopy > 0) {
      file.value.markdown = getEditorState();
    }

    const res = await c_save_file(file.value, forced).catch(returnErrorHandler);

    if ('isError' in res) {
      useRustErrorNotification(res, {
        FileSaveRetry: () => saveFile(),
        FileSaveRetryForced: () => saveFile(forced),
      });
      return;
    }

    pauseWatcher();
    if (file.value) {
      file.value.modified = res.modified;
      changes.value -= changesCopy;
    }
    await nextTick();
    resumeWatcher();
  };

  const throttledSaveFile = throttle(saveFile, 2000, {});

  watch(changes, (newValue) => {
    console.log('changes watcher', newValue);
    if (newValue > 0) {
      throttledSaveFile();
    }
  });

  onBeforeUnmount(async () => {
    await throttledSaveFile.flush();
  });

  return { file, schema, error, saveFile, changes };
};
