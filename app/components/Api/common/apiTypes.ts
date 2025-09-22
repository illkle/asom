import type { Schema } from '~/types';

export type ApiSettingsComponentProps = {
  schema: Schema;
  apiConnectionData: ReturnType<typeof useApiConnection>;
};
