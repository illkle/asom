import { zDynamicViewGroup, type IDynamicViewGroup } from '~/components/DynamicView/helpers';

const disk = new ConfigTiedToSchema('viewLayout.json', zDynamicViewGroup, {
  type: 'group',
  id: 'root',
  style: { direction: 'row', gap: '4', align: 'start', justify: 'start', width: 'auto' },
  content: [],
});

const VIEW_LAYOUT_KEY = (root: string | null | undefined, folderPath: string) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'schemas',
  'viewLayout',
  folderPath,
];

export const useViewLayout = (schemaOwnerFolder: Ref<string>) => {
  const root = useRootPath();

  const q = useQuery({
    key: () => VIEW_LAYOUT_KEY(root.data.value, schemaOwnerFolder.value),
    query: () => disk.get(schemaOwnerFolder.value),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const qc = useQueryCache();

  const update = async (newValue: IDynamicViewGroup) => {
    qc.setQueryData(VIEW_LAYOUT_KEY(root.data.value, schemaOwnerFolder.value), {
      ...newValue,
    });

    void disk.set(schemaOwnerFolder.value, newValue);
  };

  return {
    q,
    update,
  };
};

const saveViewLayout = async (schemaOwnerFolder: string, viewLayout: IDynamicViewGroup) => {
  await disk.set(schemaOwnerFolder, viewLayout);
};
