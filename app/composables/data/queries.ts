import { throttle } from 'lodash-es';
import {
  c_get_all_folders,
  c_get_all_folders_by_schema,
  c_get_schemas_all,
  c_get_schemas_usable,
  c_init,
  c_resolve_schema_path,
} from '~/api/tauriActions';
import { filePathsToTree } from '~/components/FileTree/filePathsToTree';
import type { ErrFR, Schema } from '~/types';

export const KEY_DEPENDENT_ON_ROOT = (root: string | null | undefined) => [
  'root',
  root ?? 'noRoot',
];

const ROOT_PATH_KEY = ['rooPath'];
const USABLE_SCHEMAS_KEY = (root: string | null | undefined) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'schemas',
  'usable',
];
const EXISTING_SCHEMAS_KEY = (root: string | null | undefined) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'schemas',
  'existing',
];
const FOLDERS_BY_SCHEMA_KEY = (root: string | null | undefined, schemaPath: string) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'schemas',
  'folders',
  schemaPath,
];

const FOLDERS_LIST_KEY = (root: string | null | undefined) => [
  ...KEY_DEPENDENT_ON_ROOT(root),
  'folders',
  'all',
];

export const useRootPathFromQuery = () => {
  return useQuery({
    key: ROOT_PATH_KEY,
    query: c_init,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });
};

export const useUsableSchemas = () => {
  const root = useRootPathFromQuery();

  const q = useQuery({
    key: () => USABLE_SCHEMAS_KEY(root.data.value),
    query: c_get_schemas_usable,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
  const schemasArray = computed(() => {
    const a = Object.entries(q.data.value || {}) as [string, Schema][];
    a.sort((a, b) => a[0].localeCompare(b[0]));
    return a;
  });

  return { schemasArray, query: q };
};

export const useExistingSchemas = () => {
  const root = useRootPathFromQuery();

  const q = useQuery({
    key: () => EXISTING_SCHEMAS_KEY(root.data.value),
    query: c_get_schemas_all,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
  const schemasArray = computed(() => {
    const a = Object.entries(q.data.value || {}) as [string, Schema][];
    a.sort((a, b) => a[0].localeCompare(b[0]));
    return a;
  });

  return { schemasArray, query: q };
};

export const useIsAppUsable = () => {
  const initQ = useRootPathFromQuery();
  const { query: usableSchemasQ } = useUsableSchemas();

  const appState = computed(() => {
    if (
      // root path
      initQ.data.value?.length &&
      // usable schemas computed
      usableSchemasQ.data.value
    ) {
      return { status: 'ok' as const };
    }

    if (initQ.isLoading.value || usableSchemasQ.isLoading.value) {
      return { status: 'pending' as const };
    }

    if (initQ.status.value === 'success' && !initQ.data.value?.length) {
      return { status: 'noRootPath' as const };
    }

    if (initQ.error.value) {
      return { status: 'error' as const, error: initQ.error.value };
    }

    if (usableSchemasQ.error.value) {
      return { status: 'error' as const, error: usableSchemasQ.error.value };
    }

    return {
      status: 'error' as const,
      error: { title: 'Unknown App State', info: 'Please report bug' } as ErrFR,
    };
  });

  return appState;
};

/**
 * Passing string here is not reactive, but it's okay because component it's used in is keyed on schemaPath
 */
export const useFoldersBySchema = (schemaPath: string) => {
  const root = useRootPathFromQuery();

  const q = useQuery({
    key: () => FOLDERS_BY_SCHEMA_KEY(root.data.value, schemaPath),
    query: async () => await c_get_all_folders_by_schema(schemaPath),
    refetchOnMount: true,
  });

  const foldersAsTree = computed(() =>
    !q.data.value || 'isError' in q.data.value ? [] : filePathsToTree(q.data.value),
  );

  return { foldersAsTree, query: q };
};

/**
 * Gets data about all folders. Even ones without schema.
 */
export const useFoldersList = ({ throttleMs = 200 }: { throttleMs?: number } = {}) => {
  const root = useRootPathFromQuery();

  const {
    data: foldersRaw,
    isPending,
    refetch,
  } = useQuery({
    key: () => FOLDERS_LIST_KEY(root.data.value),
    query: async () => {
      return await c_get_all_folders();
    },
  });

  const throttledRefetch = throttle(refetch, throttleMs, {});

  const foldersAsTree = computed(() =>
    !foldersRaw.value || 'isError' in foldersRaw.value ? [] : filePathsToTree(foldersRaw.value),
  );

  return { folders: foldersRaw, isPending, refetch, throttledRefetch, foldersAsTree };
};

export const useSchemaByPath = (path: Ref<string | undefined>) => {
  const root = useRootPathFromQuery();

  return useQuery({
    key: () => [
      ...KEY_DEPENDENT_ON_ROOT(root.data.value),
      'schemas',
      'byPath',
      path.value ?? 'noPath',
    ],
    query: async () => {
      return await c_resolve_schema_path(path.value ?? '');
    },
  });
};

export const useGlobalInvalidators = () => {
  const root = useRootPathFromQuery();

  const qc = useQueryCache();

  useListenToEvent('FolderAdd', async () => {
    await qc.invalidateQueries({ key: [...KEY_DEPENDENT_ON_ROOT(root.data.value), 'folders'] });
  });

  useListenToEvent('FolderRemove', async () => {
    await qc.invalidateQueries({ key: [...KEY_DEPENDENT_ON_ROOT(root.data.value), 'folders'] });
  });

  useListenToEvent('SchemasUpdated', async () => {
    await qc.invalidateQueries({ key: [...KEY_DEPENDENT_ON_ROOT(root.data.value), 'schemas'] });
    await qc.invalidateQueries({ key: [...KEY_DEPENDENT_ON_ROOT(root.data.value), 'folders'] });
  });

  useListenToEvent('EventOverflow', async ({ c }) => {
    setTimeout(async () => {
      await qc.invalidateQueries({ key: [...KEY_DEPENDENT_ON_ROOT(root.data.value)] });
    }, c ?? 200);
  });
};

export const useFolderInvalidator = () => {
  const root = useRootPathFromQuery();

  const qc = useQueryCache();
  const handler = () => {
    qc.invalidateQueries({ key: [...KEY_DEPENDENT_ON_ROOT(root.data.value), 'folders'] });
  };

  return handler;
};
