import { ApiDataMap, type ApiSettings, type InferApiData } from '~/components/Api/apis';
import { apiConverters } from '~/components/Api/base';
import type { RecordFromDb, Schema } from '~/types';

export const makeFileAttrsFromApi = async <ApiConfig extends ApiSettings>({
  apiSettings,
  apiData,
  schema,
  context,
}: {
  apiSettings: ApiConfig;
  apiData: InferApiData<ApiConfig['type']>;
  schema: Schema;
  context: {
    rootPath: string;
    recordName: string;
  };
}): Promise<RecordFromDb['attrs']> => {
  if (!context.rootPath) {
    throw new Error('Root path is required');
  }

  const result: RecordFromDb['attrs'] = {};

  const apiSchema = ApiDataMap[apiSettings.type];

  const namedSchemaItems = Object.fromEntries(schema.items.map((item) => [item.name, item]));

  for (const key in apiSchema) {
    const mapping = apiSettings.mapping[key];
    if (!mapping) {
      console.log('no mapping for', key);
      continue;
    }

    const schemaItem = namedSchemaItems[mapping.schemaName];
    if (!schemaItem) {
      console.log('no schema item for', key);
      continue;
    }

    const apiType = apiSchema[key as keyof typeof apiType];
    const apiValue = apiData[key as keyof typeof apiData];

    if (!apiValue) {
      console.log('no api value for', key);
      continue;
    }

    const conv = await apiConverters[apiType as keyof typeof apiConverters];

    const resultValue = await conv({
      apiValue: apiValue as any,
      schemaType: schemaItem.value.type,
      flags: mapping.converterFlags,
      context,
    });

    if (resultValue) {
      result[mapping.schemaName] = resultValue;
    }
  }

  return result;
};
