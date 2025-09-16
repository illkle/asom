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

type ConvertFunction<K extends keyof ExApiValueFor> = ({
  apiValue,
}: {
  apiValue: ExApiValueFor[K];
  context: {
    rootPath: string;
    recordName: string;
  };
}) => Promise<AttrValue | null> | AttrValue | null;

type ApiValueConverters = {
  [ApiType in keyof ExApiValueFor]: {
    default: ConvertFunction<ApiType>;
    conversions: {
      [SubType in SchemaAttrType['type']]?:
        | ConvertFunction<ApiType>
        | (Record<string, ConvertFunction<ApiType>> & { default: ConvertFunction<ApiType> });
    };
  };
};

export const apiValueConverters: ApiValueConverters = {
  Text: {
    default: ({ apiValue }) => {
      return { type: 'String', value: apiValue };
    },
    conversions: {
      TextCollection: ({ apiValue }) => {
        return { type: 'StringVec', value: [apiValue] };
      },
    },
  },
  TextCollection: {
    default: ({ apiValue }) => {
      return { type: 'StringVec', value: apiValue };
    },
    conversions: {
      Text: {
        default: ({ apiValue }) => {
          return { type: 'StringVec', value: apiValue };
        },
        all: ({ apiValue }) => {
          return { type: 'String', value: apiValue.join(', ') };
        },
        first: ({ apiValue }) => {
          return { type: 'String', value: apiValue[0] ?? null };
        },
      },
    },
  },
  Number: {
    default: ({ apiValue }) => {
      return { type: 'Float', value: apiValue };
    },
    conversions: {
      Text: ({ apiValue }) => {
        return { type: 'String', value: String(apiValue) };
      },
      TextCollection: ({ apiValue }) => {
        return { type: 'StringVec', value: [String(apiValue)] };
      },
    },
  },
  Date: {
    default: ({ apiValue }) => {
      return { type: 'String', value: jsDateToFileString(apiValue) };
    },
    conversions: {
      Text: {
        default: ({ apiValue }) => {
          return { type: 'String', value: jsDateToFileString(apiValue) };
        },
        year: ({ apiValue }) => {
          return { type: 'String', value: String(apiValue.getFullYear()) };
        },
        month: ({ apiValue }) => {
          return { type: 'String', value: String(apiValue.getMonth()) };
        },
        day: ({ apiValue }) => {
          return { type: 'String', value: String(apiValue.getDate()) };
        },
        'year-month-day': ({ apiValue }) => {
          return { type: 'String', value: jsDateToFileString(apiValue) };
        },
      },
      Number: {
        default: ({ apiValue }) => {
          return { type: 'Integer', value: apiValue.getFullYear() };
        },
        year: ({ apiValue }) => {
          return { type: 'Integer', value: apiValue.getFullYear() };
        },
        month: ({ apiValue }) => {
          return { type: 'Integer', value: apiValue.getMonth() };
        },
        day: ({ apiValue }) => {
          return { type: 'Integer', value: apiValue.getDate() };
        },
      },
    },
  },
  DateCollection: {
    default: ({ apiValue }) => {
      return { type: 'StringVec', value: apiValue.map((v) => jsDateToFileString(v)) };
    },
    conversions: {},
  },
  DatesPairCollection: {
    default: ({ apiValue }) => {
      return { type: 'DatePairVec', value: apiValue };
    },
    conversions: {},
  },
  Image: {
    default: async ({ apiValue, context }) => {
      const imageName = await saveImage(apiValue as string, context.rootPath, context.recordName);

      return { type: 'String', value: imageName };
    },
    conversions: {},
  },
};

export const getConverter = (
  sourceType: SchemaAttrType['type'],
  targetType: SchemaAttrType['type'],
  mode?: string,
) => {
  if (sourceType === targetType) {
    return apiValueConverters[sourceType].default;
  }

  if (typeof apiValueConverters[sourceType].conversions[targetType] === 'function') {
    return apiValueConverters[sourceType].conversions[targetType];
  }

  if (
    mode &&
    typeof apiValueConverters[sourceType].conversions[targetType]?.[mode] === 'function'
  ) {
    return apiValueConverters[sourceType].conversions[targetType][mode];
  }

  const res = apiValueConverters[sourceType].conversions[targetType]?.default;

  if (res) {
    return res;
  }

  console.error('no converter for', sourceType, targetType, mode);
  return null;
};

export const getAllowedTargets = (sourceType: SchemaAttrType['type']) => {
  return [
    sourceType,
    ...Object.keys(apiValueConverters[sourceType].conversions),
  ] as SchemaAttrType['type'][];
};

export const getCoversionModes = (
  sourceType: SchemaAttrType['type'] | null,
  targetType: SchemaAttrType['type'] | null,
) => {
  if (!sourceType || !targetType) {
    return null;
  }

  if (typeof apiValueConverters[sourceType].conversions[targetType] === 'function') {
    return 'default';
  }

  if (!apiValueConverters[sourceType].conversions[targetType]) {
    return 'not_allowed';
  }

  return Object.keys(apiValueConverters[sourceType].conversions[targetType]).filter(
    (v) => v !== 'default',
  );
};

export type ExApiSchema = Record<string, SchemaAttrType['type']>;

export type ExApiData<T extends ExApiSchema> = {
  [K in keyof T]: ExApiValueFor[T[K]] | undefined;
};

// Needs a function to tell TS that our key-valuetype pairs are permament
export const defineExApiSchema = <T extends ExApiSchema>(schema: T): T => schema;

export const zApiToSchemaMapping = z
  .record(
    z.string(),
    z.object({
      schemaName: z.string(),
      mode: z.string().optional(),
    }),
  )
  .default({});

export type ApiToSchemaMapping = z.infer<typeof zApiToSchemaMapping>;

export const zApiSettingsBase = z.object({
  mapping: zApiToSchemaMapping,
});
