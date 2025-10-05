import { mount } from '@vue/test-utils';
import { assert, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref, type Ref } from 'vue';

// Build a minimal mock UseQueryReturn-like object from @pinia/colada
type MockUseQueryReturn<T> = {
  data: Ref<T | undefined>;
};

// Import after mocks
import { cloneDeep } from 'lodash-es';
import type { IPCReadFileByPathResult } from '~~/src-tauri/bindings/IPCReadFileByPathResult';
import { useSyncedValue } from './useFileEditor';

const useMockQuery = (
  getter: () => Promise<IPCReadFileByPathResult> | IPCReadFileByPathResult,
  initialData?: IPCReadFileByPathResult,
) => {
  return useQuery({
    key: ['mockQuery', generateUniqId()],
    query: async () => {
      return getter();
    },
    initialData: initialData ? () => initialData : undefined,
  });
};

const getTimestamp = (v: IPCReadFileByPathResult | undefined) =>
  new Date(v?.record.record.modified ?? 0);
const setTimestamp = (v: IPCReadFileByPathResult, ts: Date) => {
  v.record.record.modified = ts.getTime();
};

const makeRecord = (path: string, modified: number): IPCReadFileByPathResult => {
  return {
    record: {
      record: { modified, path, markdown: '', attrs: {} },
      parsing_error: null,
      schema: {
        location: { schema_owner_folder: '', schema_path: '' },
        schema: { name: '', version: '', items: [] },
      },
    },
    breadcrumb_items: { start: [], middle: [], end: [] },
  };
};

const makeMockComponent = ({
  fetcher,
  initial,
  updater,
  changesTracker,
  onExternalUpdate,
}: {
  fetcher: () => IPCReadFileByPathResult | Promise<IPCReadFileByPathResult>;
  initial?: IPCReadFileByPathResult;
  updater: () => Promise<Date>;
  changesTracker: Ref<number>;
  onExternalUpdate: (v: IPCReadFileByPathResult) => void;
}) => {
  const c = mount({
    setup: () => {
      const remote = useMockQuery(fetcher, initial);

      const syncedValue = useSyncedValue({
        remoteValue: remote,
        getKey: (v) => v.record.record.path ?? '',
        getTimestamp,
        setTimestamp: setTimestamp as any,
        updater,
        changesTracker,
        onExternalUpdate,
      });

      return { remote, syncedValue };
    },
    render: () => null,
  });

  const { remote, syncedValue } = c.vm as unknown as {
    remote: ReturnType<typeof useMockQuery>;
    syncedValue: ReturnType<typeof useSyncedValue<IPCReadFileByPathResult>>;
  };

  return { c, remote, syncedValue };
};

describe('useSyncedValue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes correctly when remote already loaded', async () => {
    const initial = makeRecord('p1', Date.now());

    const changesTracker = ref(0);

    const updater = vi.fn(async () => new Date(Date.now() + 1000));
    const onExternalUpdate = vi.fn();

    const { syncedValue } = makeMockComponent({
      fetcher: () => initial,
      initial,
      updater,
      changesTracker,
      onExternalUpdate,
    });

    expect(syncedValue!.editableProxy.value).toEqual(initial);
    expect(syncedValue!.lastSyncedTimestamp.value).toEqual(getTimestamp(initial));
    expect(onExternalUpdate).toHaveBeenCalledWith(initial);
    expect(changesTracker.value).toEqual(0);
  });

  it('initializes correctly when remote loaded later', async () => {
    const initial = makeRecord('p1', Date.now());

    const changesTracker = ref(0);

    const updater = vi.fn(async () => new Date(Date.now() + 1000));
    const onExternalUpdate = vi.fn();

    let allowed = false;
    const resolveWhenAllowed = (): Promise<IPCReadFileByPathResult> => {
      return new Promise((resolve) => {
        const maybeResolve = () => {
          if (allowed) {
            resolve(initial);
          } else {
            setTimeout(() => {
              maybeResolve();
            }, 1);
          }
        };

        maybeResolve();
      });
    };

    const { syncedValue, remote } = makeMockComponent({
      fetcher: resolveWhenAllowed,
      updater,
      changesTracker,
      onExternalUpdate,
    });

    await vi.waitFor(() => {
      expect(syncedValue!.editableProxy.value, 'editableProxy is null').toEqual(null);
      expect(syncedValue!.lastSyncedTimestamp.value).toEqual(null);
    });

    allowed = true;

    await vi.waitFor(() => {
      expect(syncedValue!.editableProxy.value).toEqual(initial);
      expect(syncedValue!.lastSyncedTimestamp.value).toEqual(getTimestamp(initial));
      expect(onExternalUpdate).toHaveBeenCalledWith(initial);
      expect(changesTracker.value).toEqual(0);
    });
  });

  it('updates fine from remote', async () => {
    const vals = [
      makeRecord('initial', 1000),
      makeRecord('123123', 3000),
      makeRecord('321321', 6000),
    ];
    let index = 0;

    const fetcher = () => vals[index++] as IPCReadFileByPathResult;

    const changesTracker = ref(0);

    const updater = vi.fn(async () => new Date(Date.now() + 1000));
    const onExternalUpdate = vi.fn();

    const { syncedValue, remote } = makeMockComponent({
      fetcher,
      updater,
      changesTracker,
      onExternalUpdate,
    });

    await vi.waitFor(() => {
      expect(syncedValue!.editableProxy.value).toEqual(vals[0]);
      expect(syncedValue!.lastSyncedTimestamp.value).toEqual(getTimestamp(vals[0]));
      expect(onExternalUpdate).toHaveBeenCalledWith(vals[0]);
    });

    await remote!.refetch();

    await vi.waitFor(() => {
      expect(syncedValue!.editableProxy.value).toEqual(vals[1]);
      expect(syncedValue!.lastSyncedTimestamp.value).toEqual(getTimestamp(vals[1]));
      expect(onExternalUpdate).toHaveBeenCalledWith(vals[1]);
    });
    await remote!.refetch();

    await vi.waitFor(() => {
      expect(syncedValue!.editableProxy.value).toEqual(vals[2]);
      expect(syncedValue!.lastSyncedTimestamp.value).toEqual(getTimestamp(vals[2]));
      expect(onExternalUpdate).toHaveBeenCalledWith(vals[2]);
    });

    expect(onExternalUpdate).toHaveBeenCalledTimes(3);
    expect(changesTracker.value).toEqual(0);
  });

  it('should not update if remote updated to older time than local', async () => {
    const vals = [makeRecord('initial', 5000), makeRecord('123123', 3000)];
    let index = 0;

    const fetcher = () => vals[index++] as IPCReadFileByPathResult;

    const changesTracker = ref(0);

    const updater = vi.fn(async () => new Date(Date.now() + 1000));
    const onExternalUpdate = vi.fn();

    const { syncedValue, remote } = makeMockComponent({
      fetcher,
      updater,
      changesTracker,
      onExternalUpdate,
    });

    await vi.waitFor(() => {
      expect(syncedValue!.editableProxy.value).toEqual(vals[0]);
      expect(syncedValue!.lastSyncedTimestamp.value).toEqual(getTimestamp(vals[0]));
      expect(onExternalUpdate).toHaveBeenCalledWith(vals[0]);
    });
    await remote!.refetch();

    await vi.waitFor(() => {
      expect(syncedValue!.editableProxy.value).toEqual(vals[0]);
      expect(syncedValue!.lastSyncedTimestamp.value).toEqual(getTimestamp(vals[0]));
      expect(onExternalUpdate).toHaveBeenCalledWith(vals[0]);
    });

    expect(onExternalUpdate).toHaveBeenCalledTimes(1);
    expect(changesTracker.value).toEqual(0);
  });

  it('changes tracker should be updated when updating editable', async () => {
    const vals = [makeRecord('initial', 5000)];
    let index = 0;

    const fetcher = () => vals[index++] as IPCReadFileByPathResult;

    const changesTracker = ref(0);

    const updater = vi.fn(async () => new Date(Date.now() + 1000));
    const onExternalUpdate = vi.fn();

    const { c, syncedValue } = makeMockComponent({
      fetcher,
      initial: vals[0],
      updater,
      changesTracker,
      onExternalUpdate,
    });

    await vi.waitFor(() => {
      expect(syncedValue!.editableProxy.value).toEqual(vals[0]);
      expect(syncedValue!.lastSyncedTimestamp.value).toEqual(getTimestamp(vals[0]));
      expect(onExternalUpdate).toHaveBeenCalledWith(vals[0]);
    });

    if (!syncedValue.editableProxy.value) {
      assert.fail('No editable proxy');
      return;
    }

    const expectations = cloneDeep(syncedValue.editableProxy.value);
    syncedValue.editableProxy.value.record.record.markdown = 'lol';
    expectations.record.record.markdown = 'lol';

    await vi.waitFor(() => {
      expect(syncedValue.editableProxy.value).toEqual(expectations);
      expect(changesTracker.value).toEqual(1);
    });

    c.unmount();
  });

  it('changes tracker ignores changes on timestamp and key changes', async () => {
    const vals = [makeRecord('initial', 5000)];
    let index = 0;

    const fetcher = () => vals[index++] as IPCReadFileByPathResult;

    const changesTracker = ref(0);

    const updater = vi.fn(async () => new Date(Date.now() + 1000));
    const onExternalUpdate = vi.fn();

    const { c, syncedValue } = makeMockComponent({
      fetcher,
      initial: vals[0],
      updater,
      changesTracker,
      onExternalUpdate,
    });

    await vi.waitFor(() => {
      expect(syncedValue!.editableProxy.value).toEqual(vals[0]);
      expect(syncedValue!.lastSyncedTimestamp.value).toEqual(getTimestamp(vals[0]));
      expect(onExternalUpdate).toHaveBeenCalledWith(vals[0]);
    });

    if (!syncedValue.editableProxy.value) {
      assert.fail('No editable proxy');
      return;
    }

    syncedValue.editableProxy.value.record.record.modified = 6000;
    syncedValue.editableProxy.value.record.record.path = '123123';

    expect(changesTracker.value).toEqual(0);

    c.unmount();
  });
});
