// Types are manually reexported to allow for making custom types when needed and void confusion in intellisense
import type { SortOrder } from '~/src-tauri/bindings/SortOrder';
import type { AttrValue } from '../src-tauri/bindings/AttrValue';
import type { DatePair } from '../src-tauri/bindings/DatePair';
import type { DefaultSchema } from '../src-tauri/bindings/DefaultSchema';
import type { EmptySettings } from '../src-tauri/bindings/EmptySettings';
import type { ErrFR } from '../src-tauri/bindings/ErrFR';
import type { ErrFRActionCode } from '../src-tauri/bindings/ErrFRActionCode';
import type { InputSize } from '../src-tauri/bindings/InputSize';
import type { IPCEmitEvent } from '../src-tauri/bindings/IPCEmitEvent';
import type { IPCResponces } from '../src-tauri/bindings/IPCResponces';
import type { NumberSettings } from '../src-tauri/bindings/NumberSettings';
import type { NumberStyle } from '../src-tauri/bindings/NumberStyle';
import type { RecordFromDb } from '../src-tauri/bindings/RecordFromDb';
import type { RecordListGetResult } from '../src-tauri/bindings/RecordListGetResult';
import type { Schema } from '../src-tauri/bindings/Schema';
import type { SchemaAttrType } from '../src-tauri/bindings/SchemaAttrType';
import type { SchemaItem } from '../src-tauri/bindings/SchemaItem';
import type { TextFont } from '../src-tauri/bindings/TextFont';
import type { TextSettings } from '../src-tauri/bindings/TextSettings';
import type { TextTheme } from '../src-tauri/bindings/TextTheme';
import type { TextWeight } from '../src-tauri/bindings/TextWeight';

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

export type {
  AttrValue,
  DatePair,
  DefaultSchema,
  EmptySettings,
  ErrFR,
  ErrFRActionCode,
  ExtractIPCEmitEventData,
  ExtractIpcResponcesType,
  InputSize,
  IPCEmitEvent,
  NumberSettings,
  NumberStyle,
  RecordFromDb,
  RecordListGetResult,
  Schema,
  SchemaAttrType,
  SchemaItem,
  SortOrder,
  TextFont,
  TextSettings,
  TextTheme,
  TextWeight,
};
