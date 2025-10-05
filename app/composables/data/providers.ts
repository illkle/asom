import type { ShallowRef } from 'vue';
import type { useRootPathFromQuery } from '~/composables/data/queries';

export const ROOT_PATH_PROVIDE = 'PROVIDE_ROOT_PATH';

export const useProvideRootPath = (q: ReturnType<typeof useRootPathFromQuery>) => {
  provide(ROOT_PATH_PROVIDE, readonly(q.data));
};

export const useRootPathInjectSafe = () => {
  const v = useRootPathInjectWithNull();

  if (!v.value) {
    throw new Error('useRootPathInjectSafe: Root path value is null');
  }

  return v as ShallowRef<string>;
};

export const useRootPathInjectWithNull = () => {
  const ref = inject(ROOT_PATH_PROVIDE) as
    | ReturnType<typeof useRootPathFromQuery>['data']
    | undefined;

  if (!ref) {
    throw new Error(
      'useRootPathInject: Trying to inject root path, but there was no value provided',
    );
  }

  return ref;
};
