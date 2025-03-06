import {
  keymap,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLineGutter,
  EditorView,
  ViewUpdate,
} from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { defaultHighlightStyle, syntaxHighlighting, foldKeymap } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

import { markdown, markdownKeymap } from '@codemirror/lang-markdown';
import { oneDark } from './theme';

import type { ShallowRef } from 'vue';

export const useCodeMirror = (editorTemplateRef: Readonly<ShallowRef<HTMLDivElement | null>>) => {
  const changes = ref(0);

  const onUpdate = (update: ViewUpdate) => {
    if (update.docChanged) {
      changes.value++;
    }
  };

  const listener: Extension = [EditorView.updateListener.of(onUpdate)];

  const editor = ref<EditorView | null>(null);

  const createEditor = (initialValue: string) => {
    if (editor.value) {
      editor.value.destroy();
    }
    if (!editorTemplateRef.value) return;

    editor.value = new EditorView({
      doc: initialValue,

      extensions: [
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(false),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        rectangularSelection(),
        crosshairCursor(),
        markdown({}),
        oneDark,
        keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, ...markdownKeymap]),
        listener,
        EditorView.lineWrapping,
      ],
      parent: editorTemplateRef.value,
    });
  };

  const updateEditorState = (v: string) => {
    if (!editor.value) return;

    editor.value.dispatch({
      changes: { from: 0, to: editor.value.state.doc.length, insert: v },
      selection: { anchor: Math.min(v.length, editor.value.state.selection.main.anchor) },
    });
    changes.value--;

    console.log('CM: updated');
  };

  const getEditorState = () => {
    return editor.value?.state.doc.toString() || '';
  };

  const createOrUpdateEditor = (value: string) => {
    console.log('CM: create or update', value);
    if (!editor.value) {
      createEditor(value);
    } else {
      updateEditorState(value);
    }
  };

  return { editor, createEditor, getEditorState, changes, updateEditorState, createOrUpdateEditor };
};
