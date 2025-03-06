import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Using https://github.com/one-dark/vscode-one-dark-theme/ as reference for the colors

const chalky = '#e5c07b',
  coral = '#e06c75',
  cyan = '#56b6c2',
  invalid = '#ffffff',
  ivory = '#abb2bf',
  stone = '#7d8799', // Brightened compared to original to increase contrast
  malibu = '#61afef',
  sage = '#98c379',
  whiskey = '#d19a66',
  violet = '#c678dd',
  darkBackground = '#21252b',
  highlightBackground = '#2c313a',
  background = '#282c34',
  tooltipBackground = '#353a42',
  selection = '#3E4451',
  cursor = '#528bff';

/// The colors used in the theme, as CSS color strings.
export const color = {
  chalky,
  coral,
  cyan,
  invalid,
  ivory,
  stone,
  malibu,
  sage,
  whiskey,
  violet,
  darkBackground,
  highlightBackground,
  background,
  tooltipBackground,
  selection,
  cursor,
};

/// The editor theme styles for One Dark.
export const oneDarkTheme = EditorView.theme(
  {
    '&': {
      // Main color for text
      color: 'var(--text)',
      // Main background color
      backgroundColor: 'transparent',
      fontSize: '16px',
    },

    '.cm-content': {
      // Not sure what this is
      caretColor: 'var(--cursor)',
    },

    '.cm-scroller': { fontFamily: 'inherit' },

    '&.cm-focused': {
      //remove dotted outline when focused
      outline: 'none',
    },

    '.cm-cursor, .cm-dropCursor': {
      // Cursor color
      borderLeftColor: 'var(--cursor)',
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {
        // Selection color
        backgroundColor: 'var(--selection)',
      },

    '.cm-panels': { backgroundColor: 'transparent', color: ivory },
    '.cm-panels.cm-panels-top': { borderBottom: 'none' },
    '.cm-panels.cm-panels-bottom': { borderTop: 'none' },

    '.cm-searchMatch': {
      backgroundColor: '#FFEA00',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#FFAA33',
    },

    // Search highlighting
    '.cm-activeLine': { backgroundColor: '#6699ff0b' },
    '.cm-selectionMatch': { backgroundColor: '#aafe661a' },

    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
      backgroundColor: '#bad0f847',
    },

    '.cm-gutters': {
      backgroundColor: 'transparent',
      // Color of folding arrow
      color: 'var(--fold)',
      border: '',
    },

    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
    },

    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent',
      border: 'none',
      color: '',
    },

    '.cm-tooltip': {
      border: 'none',
      backgroundColor: tooltipBackground,
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
      borderTopColor: tooltipBackground,
      borderBottomColor: tooltipBackground,
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: highlightBackground,
        color: ivory,
      },
    },
  },
  { dark: true },
);

/// The highlighting style for code in the One Dark theme.
export const oneDarkHighlightStyle = HighlightStyle.define([
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: stone, textDecoration: 'underline' },
  { tag: t.heading, fontWeight: 'bold' },
]);

/// Extension to enable the One Dark theme (both the editor theme and
/// the highlight style).
export const oneDark: Extension = [oneDarkTheme, syntaxHighlighting(oneDarkHighlightStyle)];
