import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import type {
  FileEventDataExisting,
  FileEventDataRemoved,
  RecordFromDb,
  RecordListGetResult,
  SchemaLocation,
} from '~/types';

import { useFilesListV2 } from './useFileList';

// Mock dependencies
vi.mock('~/api/tauriActions', () => ({
  c_get_files_by_path: vi.fn(),
}));

vi.mock('~/composables/useListenToEvent', () => ({
  useListenToEvent: vi.fn(),
}));

vi.mock('~/composables/useRustErrorNotifcation', () => ({
  useRustErrorNotification: vi.fn(),
  isOurError: vi.fn(),
}));

vi.mock('~/composables/useTrottledEvents', () => ({
  useThrottledEvents: vi.fn(),
}));

import { c_get_files_by_path } from '~/api/tauriActions';
import type { IOpened } from '~/composables/stores/useTabsStoreV2';
import { useThrottledEvents } from '~/composables/useTrottledEvents';

const mockSchema: SchemaLocation = {
  schema_path: '/test/schema.json',
  schema_owner_folder: '/test',
};

const makeMockOpened = (): IOpened => ({
  _type: 'folder',
  _path: '/test/' + generateUniqId(),
  details: {},
  scrollPositionX: 0,
  scrollPositionY: 0,
});

const createMockRecord = (
  opened: IOpened,
  name: string,
  attrs: Record<string, any> = {},
): RecordFromDb => ({
  path: opened._path + '/' + name,
  modified: new Date().toISOString(),
  markdown: `# ${name}`,
  attrs,
});

const createMockFileEventExisting = (
  opened: IOpened,
  name: string,
  record?: RecordFromDb,
): FileEventDataExisting => ({
  path: opened._path + '/' + name,
  record: record || createMockRecord(opened, name),
  schema: mockSchema,
});

const createMockFileEventRemoved = (path: string): FileEventDataRemoved => ({
  path,
  schema: mockSchema,
});

type ReturnOfUseFilesListV2 = ReturnType<typeof useFilesListV2>;

// Helper to setup composable in a proper context with Vue app
const withSetup = ({ opened, records }: { opened: IOpened; records: RecordFromDb[] }) => {
  const mockResult: RecordListGetResult = {
    schema: {
      schema: {} as any,
      location: mockSchema,
    },
    records: records,
  };

  vi.mocked(c_get_files_by_path).mockResolvedValue(mockResult);

  let capturedProcessEvents: (v: unknown[]) => void | Promise<void> = () => void 0;

  vi.mocked(useThrottledEvents).mockImplementation((processEvents, fullRefresh) => {
    capturedProcessEvents = processEvents;
    return {
      onEvent: vi.fn(),
      processQueue: vi.fn(),
    };
  });

  let result: ReturnOfUseFilesListV2;

  const app = createApp({
    setup() {
      result = useFilesListV2({ opened });
      return () => {};
    },
  });
  const el = document.createElement('div');
  app.mount(el);
  const dispose = () => app.unmount();
  return { result: result!, dispose, capturedProcessEvents };
};

describe('useFilesListV2 - processEvents', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  it('rrrr should add new files to the list', async () => {
    const opened = makeMockOpened();
    const initialRecords = [
      createMockRecord(opened, 'file1.md'),
      createMockRecord(opened, 'file2.md'),
    ];

    const { result, dispose, capturedProcessEvents } = withSetup({
      opened: opened,
      records: initialRecords,
    });

    // Wait for initial query to complete
    await nextTick();
    await sleep(100);

    expect(result.files.data.value?.records).toHaveLength(2);

    // Simulate adding a new file
    const newRecord = createMockRecord(opened, 'file3.md');
    const addEvent = createMockFileEventExisting(opened, 'file3.md', newRecord);

    capturedProcessEvents([{ event: 'add', data: addEvent }]);

    await nextTick();

    // Check that the new file was added
    expect(result.files.data.value?.records).toHaveLength(3);
    expect(result.files.data.value?.records[2]).toEqual(newRecord);

    dispose();
  });

  it('rrrr should update existing files in the list', async () => {
    const opened = makeMockOpened();
    const initialRecords = [
      createMockRecord(opened, 'file1.md', { title: 'Old Title' }),
      createMockRecord(opened, 'file2.md'),
    ];

    const { result, dispose, capturedProcessEvents } = withSetup({
      opened: opened,
      records: initialRecords,
    });

    // Wait for initial query to complete
    await nextTick();
    await sleep(100);

    expect(result.files.data.value?.records).toHaveLength(2);
    expect(result.files.data.value?.records[0]?.attrs.title).toBe('Old Title');

    // Simulate updating the first file
    const updatedRecord = createMockRecord(opened, 'file1.md', { title: 'New Title' });
    const updateEvent = createMockFileEventExisting(opened, 'file1.md', updatedRecord);

    capturedProcessEvents!([{ event: 'update', data: updateEvent }]);

    await nextTick();
    await sleep(100);

    // Check that the file was updated
    expect(result.files.data.value?.records).toHaveLength(2);
    expect(result.files.data.value?.records[0]?.attrs.title).toBe('New Title');

    dispose();
  });

  it('should remove files from the list', async () => {
    const opened = makeMockOpened();

    const initialRecords = [
      createMockRecord(opened, 'file1.md'),
      createMockRecord(opened, 'file2.md'),
      createMockRecord(opened, 'file3.md'),
    ];

    const { result, dispose, capturedProcessEvents } = withSetup({
      opened: opened,
      records: initialRecords,
    });

    // Wait for initial query to complete
    await nextTick();
    await sleep(20);

    expect(result.files.data.value?.records).toHaveLength(3);

    // Simulate removing the second file
    const removeEvent = createMockFileEventRemoved(opened._path + '/file2.md');

    capturedProcessEvents!([{ event: 'remove', data: removeEvent }]);

    await nextTick();

    // Check that the file was removed
    expect(result.files.data.value?.records).toHaveLength(2);
    expect(result.files.data.value?.records[0]?.path).toBe(opened._path + '/file1.md');
    expect(result.files.data.value?.records[1]?.path).toBe(opened._path + '/file3.md');

    dispose();
  });

  it('should handle multiple mixed operations', async () => {
    const opened = makeMockOpened();
    const initialRecords = [
      createMockRecord(opened, 'file1.md', { title: 'File 1' }),
      createMockRecord(opened, 'file2.md', { title: 'File 2' }),
      createMockRecord(opened, 'file3.md', { title: 'File 3' }),
    ];

    const { result, dispose, capturedProcessEvents } = withSetup({
      opened: opened,
      records: initialRecords,
    });

    // Wait for initial query to complete
    await nextTick();
    await sleep(20);

    expect(result.files.data.value?.records).toHaveLength(3);

    // Simulate multiple operations:
    // 1. Add a new file
    // 2. Update file1
    // 3. Remove file2
    const newRecord = createMockRecord(opened, 'file4.md', { title: 'File 4' });
    const updatedRecord1 = createMockRecord(opened, 'file1.md', { title: 'Updated File 1' });

    capturedProcessEvents!([
      { event: 'add', data: createMockFileEventExisting(opened, 'file4.md', newRecord) },
      {
        event: 'update',
        data: createMockFileEventExisting(opened, 'file1.md', updatedRecord1),
      },
      { event: 'remove', data: createMockFileEventRemoved(opened._path + '/file2.md') },
    ]);

    await nextTick();

    // Check that all operations were applied
    expect(result.files.data.value?.records).toHaveLength(3);

    // file1 should be updated
    const file1 = result.files.data.value?.records.find(
      (r) => r.path === opened._path + '/file1.md',
    );
    expect(file1?.attrs.title).toBe('Updated File 1');

    // file2 should be removed
    const file2 = result.files.data.value?.records.find(
      (r) => r.path === opened._path + '/file2.md',
    );
    expect(file2).toBeUndefined();

    // file3 should remain unchanged
    const file3 = result.files.data.value?.records.find(
      (r) => r.path === opened._path + '/file3.md',
    );
    expect(file3?.attrs.title).toBe('File 3');

    // file4 should be added
    const file4 = result.files.data.value?.records.find(
      (r) => r.path === opened._path + '/file4.md',
    );
    expect(file4?.attrs.title).toBe('File 4');

    dispose();
  });

  it('should invalidate on duplicate path events', async () => {
    const opened = makeMockOpened();
    const initialRecords = [createMockRecord(opened, 'file1.md')];

    const { result, dispose, capturedProcessEvents } = withSetup({
      opened: opened,
      records: initialRecords,
    });

    // Wait for initial query to complete
    await nextTick();
    await sleep(100);

    // Spy on console.warn to verify the warning
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Simulate duplicate path events (same path appears twice)
    const record1 = createMockRecord(opened, 'file1.md', { version: 1 });
    const record2 = createMockRecord(opened, 'file1.md', { version: 2 });

    capturedProcessEvents!([
      { event: 'update', data: createMockFileEventExisting(opened, 'file1.md', record1) },
      { event: 'update', data: createMockFileEventExisting(opened, 'file1.md', record2) },
    ]);

    // Check that a warning was logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'useFileList: duplicate path event',
      opened._path + '/file1.md',
    );

    consoleWarnSpy.mockRestore();
    dispose();
  });

  it('should handle events when no existing data is present', async () => {
    const opened = makeMockOpened();
    const records: RecordFromDb[] = [];

    const { result, dispose, capturedProcessEvents } = withSetup({
      opened: opened,
      records: records,
    });

    // Don't wait for the query to complete - immediately try to process events
    // This simulates the case where events arrive before data is loaded

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const newRecord = createMockRecord(opened, 'file1.md');
    capturedProcessEvents!([
      { event: 'add', data: createMockFileEventExisting(opened, 'file1.md', newRecord) },
    ]);

    // Should warn about trying to process events without existing data
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'useFileList: trying to process events without existing data',
    );

    consoleWarnSpy.mockRestore();
    dispose();
  });

  it('should correctly handle remove and add operations for the same path', async () => {
    const opened = makeMockOpened();
    const initialRecords = [
      createMockRecord(opened, 'file1.md', { title: 'Original' }),
      createMockRecord(opened, 'file2.md'),
    ];

    const { result, dispose, capturedProcessEvents } = withSetup({
      opened: opened,
      records: initialRecords,
    });

    // Wait for initial query to complete
    await nextTick();
    await sleep(100);

    expect(result.files.data.value?.records).toHaveLength(2);

    // Simulate removing and then adding a file (e.g., file replacement)
    // This should NOT trigger duplicate path warning because we process them in order
    const newRecord = createMockRecord(opened, 'file1.md', { title: 'Replaced' });

    capturedProcessEvents!([
      { event: 'remove', data: createMockFileEventRemoved(opened._path + '/file1.md') },
    ]);

    capturedProcessEvents!([
      { event: 'add', data: createMockFileEventExisting(opened, 'file1.md', newRecord) },
    ]);

    await nextTick();

    // Check that we still have 2 files
    expect(result.files.data.value?.records).toHaveLength(2);

    // The file should have the new content
    const file1 = result.files.data.value?.records.find(
      (r) => r.path === opened._path + '/file1.md',
    );
    expect(file1?.attrs.title).toBe('Replaced');

    dispose();
  });

  it('should preserve order when updating files', async () => {
    const opened = makeMockOpened();
    const initialRecords = [
      createMockRecord(opened, 'file1.md'),
      createMockRecord(opened, 'file2.md'),
      createMockRecord(opened, 'file3.md'),
    ];

    const { result, dispose, capturedProcessEvents } = withSetup({
      opened: opened,
      records: initialRecords,
    });

    // Wait for initial query to complete
    await nextTick();
    await sleep(100);

    // Update the middle file
    const updatedRecord = createMockRecord(opened, 'file2.md', { updated: true });

    capturedProcessEvents!([
      {
        event: 'update',
        data: createMockFileEventExisting(opened, 'file2.md', updatedRecord),
      },
    ]);

    await nextTick();

    // Check that the order is preserved
    expect(result.files.data.value?.records).toHaveLength(3);
    expect(result.files.data.value?.records[0]?.path).toBe(opened._path + '/file1.md');
    expect(result.files.data.value?.records[1]?.path).toBe(opened._path + '/file2.md');
    expect(result.files.data.value?.records[2]?.path).toBe(opened._path + '/file3.md');
    expect(result.files.data.value?.records[1]?.attrs.updated).toBe(true);

    dispose();
  });

  it('should append new files at the end', async () => {
    const opened = makeMockOpened();
    const initialRecords = [
      createMockRecord(opened, 'file1.md'),
      createMockRecord(opened, 'file2.md'),
    ];

    const { result, dispose, capturedProcessEvents } = withSetup({
      opened: opened,
      records: initialRecords,
    });

    // Wait for initial query to complete
    await nextTick();
    await sleep(100);

    // Add multiple files
    const newRecord3 = createMockRecord(opened, 'file3.md');
    const newRecord4 = createMockRecord(opened, 'file4.md');

    capturedProcessEvents!([
      { event: 'add', data: createMockFileEventExisting(opened, 'file3.md', newRecord3) },
      { event: 'add', data: createMockFileEventExisting(opened, 'file4.md', newRecord4) },
    ]);

    await nextTick();

    // Check that files were added in order at the end
    expect(result.files.data.value?.records).toHaveLength(4);
    expect(result.files.data.value?.records[2]?.path).toBe(opened._path + '/file3.md');
    expect(result.files.data.value?.records[3]?.path).toBe(opened._path + '/file4.md');

    dispose();
  });
});
