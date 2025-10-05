import { ApiDataMap, type ApiSettings, type InferApiData } from '~/components/Api/apis';
import { getConverter } from '~/components/Api/base';
import type { RecordFromDb, Schema } from '~/types';

export type APIEmitData<ApiConfig extends ApiSettings> = {
  apiSettings: ApiConfig;
  apiData: InferApiData<ApiConfig['type']>;
  schema: Schema;
  recordName: string;
};

export const makeFileAttrsFromApi = async <ApiConfig extends ApiSettings>({
  data,
  rootPath,
}: {
  data: APIEmitData<ApiConfig>;
  rootPath: string;
}): Promise<RecordFromDb['attrs']> => {
  if (!rootPath) {
    throw new Error('Root path is required');
  }
  const { apiSettings, apiData, schema } = data;

  const result: RecordFromDb['attrs'] = {};

  const apiSchema = ApiDataMap[apiSettings.type];

  const namedSchemaItems = Object.fromEntries(schema.items.map((item) => [item.name, item]));

  for (const [key, apiType] of Object.entries(apiSchema)) {
    const mapping = apiSettings.mapping[key];
    if (!mapping) {
      continue;
    }

    const schemaItem = namedSchemaItems[mapping.schemaName];
    if (!schemaItem) {
      continue;
    }

    const schemaType = schemaItem.value.type;

    const apiValue = apiData[key as keyof typeof apiData];

    if (!apiValue) {
      continue;
    }

    const c = getConverter(apiType, schemaType, mapping.mode);

    if (!c) {
      continue;
    }

    const resultValue = await c({
      apiValue: apiValue as never,
      context: { rootPath, recordName: data.recordName },
    });

    if (resultValue) {
      result[mapping.schemaName] = resultValue;
    }
  }

  return result;
};
