import { c_get_schemas, c_init } from '~/api/tauriActions';
import type { ErrFR } from '~/types';

export const useRootPath = () => {
  return useQuery({
    key: ['rooPath'],
    query: c_init,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });
};

export const useUsableSchemas = () => {
  const root = useRootPath();

  const q = useQuery({
    key: () => ['root', root.data.value ?? 'noRoot', 'schemas', 'get'],
    query: c_get_schemas,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // This is needed for returning from schemas editor
    refetchOnMount: true,
  });

  useListenToEvent('SchemasUpdated', () => {
    q.refetch();
  });

  useListenToEvent('SchemaUpdated', () => {
    q.refetch();
  });

  return q;
};

export const useIsAppUsable = () => {
  const initQ = useRootPath();
  const usableSchemasQ = useUsableSchemas();

  const appState = computed(() => {
    if (
      // root path
      initQ.data.value?.length &&
      // at least one schema
      usableSchemasQ.data.value &&
      Object.keys(usableSchemasQ.data.value).length
    ) {
      return { status: 'ok' as const };
    }

    if (initQ.isLoading.value || usableSchemasQ.isLoading.value) {
      return { status: 'pending' as const };
    }

    if (initQ.status.value === 'success' && !initQ.data.value?.length) {
      return { status: 'noRootPath' as const };
    }

    if (
      usableSchemasQ.status.value === 'success' &&
      !Object.keys(usableSchemasQ.data.value || {}).length
    ) {
      return { status: 'zeroSchemas' as const };
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
