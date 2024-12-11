// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { EmptySettings } from './EmptySettings';
import type { NumberSettings } from './NumberSettings';
import type { TextCollectionSettings } from './TextCollectionSettings';
import type { TextSettings } from './TextSettings';

export type SchemaAttrKey =
  | { type: 'Text'; settings: TextSettings }
  | { type: 'TextCollection'; settings: TextCollectionSettings }
  | { type: 'Number'; settings: NumberSettings }
  | { type: 'Date'; settings: EmptySettings }
  | { type: 'DateCollection'; settings: EmptySettings }
  | { type: 'DatesPairCollection'; settings: EmptySettings }
  | { type: 'Image'; settings: EmptySettings };
