import { throttle } from 'lodash';
import { c_get_all_folders } from '~/api/tauriActions';
import { filePathsToTree } from '~/components/FileTree/filePathsToTree';
import { useListenToEvent } from '~/composables/useListenToEvent';
import { useMainStore } from '~/composables/stores/useMainStore';
/**
 * Gets data about all folders. Even ones without schema.
 */
export const useFoldersList = ({ throttleMs = 200 }: { throttleMs?: number } = {}) => {
  const {
    data: foldersRaw,
    isPending,
    refetch,
  } = useQuery({
    key: ['folders', 'all'],
    query: c_get_all_folders,
  });

  const store = useMainStore();

  const throttledRefetch = throttle(refetch, throttleMs, {});

  useListenToEvent('FolderAdd', (v) => {
    throttledRefetch();
  });

  useListenToEvent('FolderRemove', (v) => {
    throttledRefetch();
  });

  // Schema updates affect which folders have schemas
  useListenToEvent('SchemaUpdated', (v) => {
    throttledRefetch();
  });
  useListenToEvent('SchemasUpdated', (v) => {
    throttledRefetch();
  });

  const foldersAsTree = computed(() =>
    !foldersRaw.value || 'isError' in foldersRaw.value
      ? []
      : filePathsToTree(foldersRaw.value, store.rootPath || ''),
  );

  return { folders: foldersRaw, isPending, refetch, throttledRefetch, foldersAsTree };
};
