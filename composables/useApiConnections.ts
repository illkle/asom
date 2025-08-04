import z from 'zod';
import { ConfigStoredInRootFolder } from '~/utils/configStoredInRootFolder';

const zApiConnections = z.object({
  twitchigdb_clientId: z.string().optional(),
  twitchigdb_clientSecret: z.string().optional(),
  twitchigdb_accessToken: z.string().optional(),
  twitchigdb_expiresAt: z.number().optional(),
});

const disk = new ConfigStoredInRootFolder('apiConnections.json', zApiConnections);

const API_CONNECTIONS_KEY = (root: string | null | undefined) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'apiConnections',
];

export const useApiConnections = () => {
  const root = useRootPath();

  const q = useQuery({
    key: () => API_CONNECTIONS_KEY(root.data.value),
    query: () => disk.get(),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const qc = useQueryCache();

  const update = async (newData: Partial<z.infer<typeof zApiConnections>>) => {
    const current = await disk.get();

    const data = zApiConnections.parse({
      ...current,
      ...newData,
    });

    qc.setQueryData(API_CONNECTIONS_KEY(root.data.value), data);
    void disk.set(data);
  };

  return {
    q,
    update,
  };
};
