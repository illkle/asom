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
      doc = getEditorState();
      editor.value.destroy();
    }

    editor.value = new EditorView({
      doc,

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
    if (!editor.value) {
      createEditor(value);
    } else {
      updateEditorState(value);
    }
  };

  return { editor, createEditor, getEditorState, updateEditorState, createOrUpdateEditor };
};
