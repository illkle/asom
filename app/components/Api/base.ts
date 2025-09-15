import { z } from 'zod';
import { saveImage } from '~/components/Api/saveImage';
import type { AttrValue, DatePair, SchemaAttrType } from '~/types';

export type ExApiValueFor = {
  Text: string;
  TextCollection: string[];
  Number: number;
  Date: Date;
  DateCollection: Date[];
  DatesPairCollection: DatePair[];
  Image: string;
};

type ExApiValueMapper = {
  [K in keyof ExApiValueFor]: (v: {
    schemaType: SchemaAttrType['type'];
    apiValue: ExApiValueFor[K];
    flags: ConverterFlags;
    context: {
      rootPath: string;
      recordName: string;
    };
  }) => Promise<AttrValue | null> | AttrValue | null;
};

type ApiValueAllowedConversions = {
  [K in keyof ExApiValueFor]: Array<keyof ExApiValueFor>;
};

export const apiValueAllowedConversions: ApiValueAllowedConversions = {
  Text: ['TextCollection'],
  TextCollection: ['Text'],
  Number: ['Text', 'TextCollection'],
  Date: ['Text', 'TextCollection', 'Number'],
  DateCollection: [],
  DatesPairCollection: [],
  Image: [],
};

export const apiConverters: ExApiValueMapper = {
  Text: ({ schemaType, apiValue }) => {
    switch (schemaType) {
      case 'Text':
        return { type: 'String', value: apiValue };
      case 'TextCollection':
        return { type: 'StringVec', value: [apiValue] };
    }
    return null;
  },
  TextCollection: ({ schemaType, apiValue, flags }) => {
    switch (schemaType) {
      case 'TextCollection':
        return { type: 'StringVec', value: apiValue };
      case 'Text':
        return {
          type: 'String',
          value: flags.TextToTextCollection === 'all' ? apiValue.join(', ') : (apiValue[0] ?? null),
        };
    }
    return null;
  },
  Number: ({ schemaType, apiValue }) => {
    switch (schemaType) {
      case 'Number':
        return { type: 'Float', value: apiValue };
      case 'Text':
        return { type: 'String', value: String(apiValue) };
      case 'TextCollection':
        return { type: 'StringVec', value: [String(apiValue)] };
    }
    return null;
  },
  Date: ({ schemaType, apiValue, flags }) => {
    switch (schemaType) {
      case 'Date':
        return { type: 'String', value: jsDateToFileString(apiValue) };
      case 'Text':
        switch (flags.DateToText) {
          case 'year':
            return { type: 'String', value: String(apiValue.getFullYear()) };
          case 'month':
            return { type: 'String', value: String(apiValue.getMonth()) };
          case 'day':
            return { type: 'String', value: String(apiValue.getDate()) };
          case 'year-month-day':
          default:
            return { type: 'String', value: jsDateToFileString(apiValue) };
        }
      case 'Number':
        switch (flags.DateToNumber) {
          case 'year':
            return { type: 'Integer', value: apiValue.getFullYear() };
          case 'month':
            return { type: 'Integer', value: apiValue.getMonth() };
          case 'day':
            return { type: 'Integer', value: apiValue.getDate() };
        }
    }
    return null;
  },
  DateCollection: ({ schemaType, apiValue }) => {
    switch (schemaType) {
      case 'DateCollection':
        return { type: 'StringVec', value: apiValue.map((v) => jsDateToFileString(v)) };
    }
    return null;
  },
  DatesPairCollection: ({ schemaType, apiValue }) => {
    switch (schemaType) {
      case 'DatesPairCollection':
        return { type: 'DatePairVec', value: apiValue };
    }
    return null;
  },
  Image: async ({ schemaType, apiValue, context }) => {
    switch (schemaType) {
      case 'Image':
        const imageName = await saveImage(apiValue as string, context.rootPath, context.recordName);

        return { type: 'String', value: imageName };
    }
    return null;
  },
};

export type ExApiSchema = Record<string, SchemaAttrType['type']>;

export type ExApiData<T extends ExApiSchema> = {
  [K in keyof T]: ExApiValueFor[T[K]] | undefined;
};

// Needs a function to tell TS that our key-valuetype pairs are permament
export const defineExApiSchema = <T extends ExApiSchema>(schema: T): T => schema;

export const TextToTextCollection = ['all', 'first'] as const;
export const DateToText = ['year-month-day', 'year', 'month', 'day'] as const;
export const DateToNumber = ['year', 'month', 'day'] as const;

const zConverterFlags = z
  .object({
    TextToTextCollection: z.enum(TextToTextCollection).optional(),
    DateToText: z.enum(DateToText).optional(),
    DateToNumber: z.enum(DateToNumber).optional(),
  })
  .default({});

export type ConverterFlags = z.infer<typeof zConverterFlags>;

export const zApiToSchemaMapping = z
  .record(
    z.string(),
    z.object({
      schemaName: z.string(),
      converterFlags: zConverterFlags,
    }),
  )
  .default({});

export type ApiToSchemaMapping = z.infer<typeof zApiToSchemaMapping>;

export type ApiToSchemaMappingSpecific<T extends ExApiSchema> = Record<
  keyof T,
  { schemaName: string; converterFlags: ConverterFlags }
>;

export const zApiSettingsBase = z.object({
  mapping: zApiToSchemaMapping,
});
