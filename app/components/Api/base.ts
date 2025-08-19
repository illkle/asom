import type { SchemaAttrType } from '~/types';

export type ExApiValueFor = {
  Text: string;
  TextCollection: string[];
  Number: number;
  Date: Date;
  DateCollection: Date[];
  DatesPairCollection: null;
  Image: string;
  StringVec: string[];
};

export type ExApiSchema = Record<string, SchemaAttrType['type']>;

export type ExApiData<T extends ExApiSchema> = {
  [K in keyof T]: ExApiValueFor[T[K]] | undefined;
};

// Needs a function to tell TS that our key-valuetype pairs are permament
export const defineExApiSchema = <T extends ExApiSchema>(schema: T): T => schema;
