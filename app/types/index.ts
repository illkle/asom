// Types are manually reexported to allow for making custom types when needed and void confusion in intellisense
import type { AttrValue } from '../../src-tauri/bindings/AttrValue';
import type { DatePair } from '../../src-tauri/bindings/DatePair';
import type { DefaultSchema } from '../../src-tauri/bindings/DefaultSchema';
import type { EmptySettings } from '../../src-tauri/bindings/EmptySettings';
import type { ErrFR } from '../../src-tauri/bindings/ErrFR';
import type { ErrFRActionCode } from '../../src-tauri/bindings/ErrFRActionCode';
import type { FolderListGetResult } from '../../src-tauri/bindings/FolderListGetResult';
import type { ImageSettings } from '../../src-tauri/bindings/ImageSettings';
import type { InputSize } from '../../src-tauri/bindings/InputSize';
import type { IPCEmitEvent } from '../../src-tauri/bindings/IPCEmitEvent';
import type { IPCResponces } from '../../src-tauri/bindings/IPCResponces';
import type { NumberSettings } from '../../src-tauri/bindings/NumberSettings';
import type { NumberStyle } from '../../src-tauri/bindings/NumberStyle';
import type { RecordFromDb } from '../../src-tauri/bindings/RecordFromDb';
import type { RecordListGetResult } from '../../src-tauri/bindings/RecordListGetResult';
import type { Schema } from '../../src-tauri/bindings/Schema';
import type { SchemaAttrType } from '../../src-tauri/bindings/SchemaAttrType';
import type { SchemaItem } from '../../src-tauri/bindings/SchemaItem';
import type { SchemaResult } from '../../src-tauri/bindings/SchemaResult';
import type { SortOrder } from '../../src-tauri/bindings/SortOrder';
import type { TextCollectionSettings } from '../../src-tauri/bindings/TextCollectionSettings';
import type { TextFont } from '../../src-tauri/bindings/TextFont';
import type { TextSettings } from '../../src-tauri/bindings/TextSettings';
import type { TextWeight } from '../../src-tauri/bindings/TextWeight';

type ExtractIPCEmitEventData<T extends IPCEmitEvent['type']> = Extract<
  IPCEmitEvent,
  { type: T }
>['data'];

type ExtractIpcResponcesType<K extends keyof IPCResponces> = Extract<
  IPCResponces[K],
  { Ok: any }
>['Ok'];

export const AttrValueKeys: AttrValue['type'][] = [
  'DatePairVec',
  'Float',
  'Integer',
  'String',
  'StringVec',
] as const;

export const SchemaItemKeys: SchemaItem['value']['type'][] = [
  'Text',
  'TextCollection',
  'Number',
  'Date',
  'DateCollection',
  'DatesPairCollection',
  'Image',
] as const;

export type {
  AttrValue,
  DatePair,
  DefaultSchema,
  EmptySettings,
  ErrFR,
  ErrFRActionCode,
  ExtractIPCEmitEventData,
  ExtractIpcResponcesType,
  FolderListGetResult,
  ImageSettings,
  InputSize,
  IPCEmitEvent,
  NumberSettings,
  NumberStyle,
  RecordFromDb,
  RecordListGetResult,
  Schema,
  SchemaAttrType,
  SchemaItem,
  SchemaResult,
  SortOrder,
  TextCollectionSettings,
  TextFont,
  TextSettings,
  TextWeight,
};
