import { ApiDataMap, type ApiSettings, type InferApiData } from '~/components/Api/apis';
import { getConverter } from '~/components/Api/base';
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

  for (const [key, apiType] of Object.entries(apiSchema)) {
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

    const schemaType = schemaItem.value.type;

    const apiValue = apiData[key as keyof typeof apiData];

    if (!apiValue) {
      console.log('no api value for', key);
      continue;
    }

    const c = getConverter(apiType, schemaType, mapping.mode);

    if (!c) {
      continue;
    }

    const resultValue = await c({
      apiValue: apiValue as never,
      context,
    });

    if (resultValue) {
      result[mapping.schemaName] = resultValue;
    }
  }

  return result;
};
