// Types are manually reexported to allow for making custom types when needed and avoid confusion in intellisense
import type { TextWeight } from '../../src-tauri/bindings/TextWeight';
import type { TextTheme } from '../../src-tauri/bindings/TextTheme';
import type { TextFont } from '../../src-tauri/bindings/TextFont';
import type { TextSettings } from '../../src-tauri/bindings/TextSettings';
import type { SchemaItem } from '../../src-tauri/bindings/SchemaItem';
import type { InputSize } from '../../src-tauri/bindings/InputSize';
import type { Schema } from '../../src-tauri/bindings/Schema';
import type { SchemaAttrKey } from '../../src-tauri/bindings/SchemaAttrKey';
import type { NumberStyle } from '../../src-tauri/bindings/NumberStyle';
import type { NumberSettings } from '../../src-tauri/bindings/NumberSettings';
import type { EmptySettings } from '../../src-tauri/bindings/EmptySettings';
import type { DefaultSchema } from '../../src-tauri/bindings/DefaultSchema';
import type { DateRead } from '../../src-tauri/bindings/DateRead';
import type { AttrKey } from '../../src-tauri/bindings/AttrKey';
import type { AttrValue } from '../../src-tauri/bindings/AttrValue';
import type { ErrorFromRust } from '../../src-tauri/bindings/ErrorFromRust';
import type { ErrorActionCode } from '../../src-tauri/bindings/ErrorActionCode';
import type { BookFromDb } from '../../src-tauri/bindings/BookFromDb';
import type { BookListGetResult } from '../../src-tauri/bindings/BookListGetResult';
import type { IPCEmitEvent } from '../../src-tauri/bindings/IPCEmitEvent';
import type { IPCResponces } from '../../src-tauri/bindings/IPCResponces';

type ExtractIPCEmitEventData<T extends IPCEmitEvent['type']> = Extract<
  IPCEmitEvent,
  { type: T }
>['data'];

type ExtractIpcResponcesType<K extends keyof IPCResponces> = Extract<
  IPCResponces[K],
  { Ok: any }
>['Ok'];

export const AttrValueKeys: AttrValue['type'][] = [
  'DateReadVec',
  'Integer',
  'Float',
  'String',
  'StringVec',
] as const;

export type {
  TextWeight,
  TextTheme,
  TextFont,
  InputSize,
  NumberStyle,
  NumberSettings,
  EmptySettings,
  SchemaItem,
  SchemaAttrKey,
  Schema,
  TextSettings,
  BookListGetResult,
  ErrorFromRust,
  ErrorActionCode,
  BookFromDb,
  DefaultSchema,
  DateRead,
  AttrKey,
  AttrValue,
  IPCEmitEvent,
  ExtractIPCEmitEventData,
  ExtractIpcResponcesType,
};
