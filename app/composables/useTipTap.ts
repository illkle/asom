import type { ShallowRef } from 'vue';

import { ListKit } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';

import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

import { Editor } from '@tiptap/vue-3';

export const tiptapExtensions = [
  StarterKit.configure({
    listItem: false,
    listKeymap: false,
    bulletList: false,
    orderedList: false,
  }),
  Markdown,
  ListKit,
  TableKit.configure({
    table: { resizable: true },
  }),
];

export const useTipTap = ({
  editorTemplateRef,
  onChange,
}: {
  editorTemplateRef: Readonly<ShallowRef<HTMLDivElement | null>>;
  onChange: () => void;
}) => {
  const editor = ref<Editor | null>(null);

  /** First request to create editor is usually made before editor template ref is available(because dom is still in loading state). So we store pending value here */
  const pendingCreation = ref<null | string>(null);

  const createEditor = (initialValue: string) => {
    if (!editorTemplateRef.value) {
      if (initialValue) {
        pendingCreation.value = initialValue;
      }
      return;
    }

    let doc = initialValue ? initialValue : (pendingCreation.value ?? '');

    if (editor.value) {
      doc = getEditorState() ?? '';
      editor.value.destroy();
    }

    editor.value = new Editor({
      element: editorTemplateRef.value,
      extensions: tiptapExtensions,
      content: doc,
      contentType: 'markdown',
      onUpdate: () => {
        onChange();
      },
    });
  };

  watch(editorTemplateRef, (v) => {
    if (!v) return;
    console.log('watch(editorTemplateRef): creating editor', v);
    createEditor('');
  });

  const updateEditorState = (v: string) => {
    if (!editor.value) {
      console.error('updateEditorState: editor is null');
      return;
    }

    console.log('updateEditorState: updating editor state', v.length);

    editor.value.commands.setContent(v, { emitUpdate: false, contentType: 'markdown' });
  };

  const getEditorState = () => {
    return editor.value?.getMarkdown();
  };

  const createOrUpdateEditor = (value: string) => {
    if (!editor.value) {
      createEditor(value);
    } else {
      updateEditorState(value);
    }
  };

  return { editor, createEditor, getEditorState, updateEditorState, createOrUpdateEditor };
};
