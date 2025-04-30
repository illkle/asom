import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { defaultHighlightStyle, foldKeymap, syntaxHighlighting } from '@codemirror/language';
import { Annotation, EditorState, type Extension } from '@codemirror/state';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLineGutter,
  keymap,
  rectangularSelection,
  ViewUpdate,
} from '@codemirror/view';

import { markdown, markdownKeymap } from '@codemirror/lang-markdown';
import { oneDark } from './theme';

import type { ShallowRef } from 'vue';

export const useCodeMirror = ({
  editorTemplateRef,
  onChange,
}: {
  editorTemplateRef: Readonly<ShallowRef<HTMLDivElement | null>>;
  onChange: () => void;
}) => {
  const blockUpdate = ref(false);

  const internalUpdateMarker = Annotation.define();

  const onUpdate = (update: ViewUpdate) => {
    if (
      !update.docChanged ||
      update.transactions.every((tr) => tr.annotation(internalUpdateMarker))
    ) {
      // Updates coming from us
      return;
    }
    // Updates coming from outside
    onChange();
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
      annotations: internalUpdateMarker.of(true),
    });
  };

  const getEditorState = () => {
    return editor.value?.state.doc.toString() || '';
  };

  const createOrUpdateEditor = (value: string) => {
    blockUpdate.value = true;
    if (!editor.value) {
      createEditor(value);
    } else {
      updateEditorState(value);
    }
    setTimeout(() => {
      blockUpdate.value = false;
    }, 100);
  };

  return { editor, createEditor, getEditorState, updateEditorState, createOrUpdateEditor };
};
