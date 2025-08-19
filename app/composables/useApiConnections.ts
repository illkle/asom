import type { UseQueryReturn } from '@pinia/colada';
import z from 'zod/v4';
import { zApiSettings } from '~/components/Api/apis';

const disk = new ConfigTiedToSchema('apiConnections.json', zApiSettings, {
  type: 'none',
});

const API_CONNECTIONS_KEY = (root: string | null | undefined, folderPath: string) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'schemas',
  'apiConnections',
  folderPath,
];

export const useApiConnection = (schemaOwnerFolder: Ref<string>) => {
  const root = useRootPath();

  const q = useQuery({
    key: () => API_CONNECTIONS_KEY(root.data.value, schemaOwnerFolder.value),
    query: () => disk.get(schemaOwnerFolder.value),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const qc = useQueryCache();

  const update = async (newData: Partial<z.infer<typeof zApiSettings>>) => {
    const current = await disk.get(schemaOwnerFolder.value);

    const data = zApiSettings.parse({
      ...current,
      ...newData,
    });

    qc.setQueryData(API_CONNECTIONS_KEY(root.data.value, schemaOwnerFolder.value), data);
    void disk.set(schemaOwnerFolder.value, data);
  };

  const editableData = useEditableRef(q, update);

  return {
    q,
    update,
    editableData,
  };
};

export const useEditableRef = <T>(
  q: UseQueryReturn<T, Error, undefined>,
  update: (newData: T) => Promise<void>,
) => {
  const proxyRef = ref<T | null>(q.data.value ?? null);

  watch(
    q.isPending,
    (newIsPending) => {
      if (!newIsPending) {
        proxyRef.value = q.data.value;
      }
    },
    { once: true },
  );

  watch(
    proxyRef,
    async (newData) => {
      await update(newData);
    },
    { deep: true },
  );

  return proxyRef;
};
