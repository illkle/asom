import { zApiSettings } from '~/components/Api/apis';
import { ConfigTiedToSchema, makeUseConfigHook } from '~/utils/configFiles';

const disk = new ConfigTiedToSchema('apiConnections.json', zApiSettings, {
  type: 'none',
  mapping: {},
});

const API_CONNECTIONS_KEY = (root: string | null | undefined, folderPath: string) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'schemas',
  'apiConnections',
  folderPath,
];

export const useApiConnection = makeUseConfigHook(disk, API_CONNECTIONS_KEY);
