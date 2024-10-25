import { invoke } from '@tauri-apps/api/core';
import { throttle } from 'lodash';
import type { ShallowRef } from 'vue';
import { toast } from 'vue-sonner';

import type { IOpenedFile } from '~/api/openedTabs';
import { c_read_file_by_path, c_save_file } from '~/api/tauriActions';
import { useListenToEvent, type IBookFromDb } from '~/api/tauriEvents';
import { useCodeMirror } from '~/components/Editor/CodeMirror/useCodeMirror';

export const useBookEditor = (
  opened: IOpenedFile,
  editorTemplateRef: Readonly<ShallowRef<HTMLDivElement | null>>,
) => {
  const file = ref<IBookFromDb | null>(null);

  const error = ref<String | null>(null);

  const { getEditorState, changes, createOrUpdateEditor } = useCodeMirror(editorTemplateRef);

  const loadFileFromDisk = async () => {
    if (opened.type !== 'file') return;
    const res = await c_read_file_by_path(opened.thing);

    if (typeof res === 'string') {
      error.value = res;
      return;
    }

    if (res.parsing_error) {
      toast('Error when parsing book frontmatter', {
        description: 'Any edits will overwrite book. ' + res.parsing_error,
      });
    }

    file.value = res.book as IBookFromDb;
    createOrUpdateEditor(res.book.markdown);
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

  const updateHandler = async (update: IBookFromDb) => {
    console.log('update handler', update);
    if (update.modified === file.value?.modified) return;
    await loadFileFromDisk();
  };

  useListenToEvent('file_update', updateHandler);

  const saveFile = async (forced = false) => {
    if (!file.value) return;

    const changesCopy = changes.value;

    if (changesCopy > 0) {
      file.value.markdown = getEditorState();
    }

    const r = await c_save_file(file.value, forced);

    if (typeof r === 'object') {
      if (file.value) {
        file.value.modified = r.modified;
        changes.value -= changesCopy;
      }
    } else {
      toast('Error when saving file', {
        description: r,
        action: {
          label: 'Retry and force save',
          onClick: () => saveFile(true),
        },
      });
    }
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

  return { file, error, saveFile, changes };
};
