import { invoke } from '@tauri-apps/api/core';
import { isOurError } from '~/composables/useRustErrorNotifcation';
import type { ErrFR, ExtractIpcResponcesType, RecordFromDb, Schema } from '~/types';

export const returnErrorHandler = (e: unknown): ErrFR => {
  if (isOurError(e)) {
    console.error('Error from rust', e);

    return e;
  }
  console.error(e);
  return {
    title: 'Unknown Javascript or Tauri error',
    info: 'See console for more details',
  } as ErrFR;
};

export const c_init = async () => {
  return invoke('c_init').then((v) => v as ExtractIpcResponcesType<'c_init'>);
};

export const c_get_root_path = async () => {
  return invoke('c_get_root_path').then((v) => v as ExtractIpcResponcesType<'c_get_root_path'>);
};

/**
 *  When forced set to false will return error if
 *  1. Book.modified is not null but is not equal to file last modified
 *  2. File does not exist already.
 */
export const c_save_file = async ({
  record,
  forced = false,
  createNew = false,
}: {
  record: RecordFromDb;
  forced?: boolean;
  createNew?: boolean;
}) => {
  return invoke('c_save_file', { record, forced, createNew }).then(
    (v) => v as ExtractIpcResponcesType<'c_save_file'>,
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const c_get_files_by_path = async (pathRelative: string) => {
  console.log(' c_get_files_by_path', pathRelative);
  return invoke('c_get_files_by_path', { pathRelative }).then((v) => {
    return v as ExtractIpcResponcesType<'c_get_files_by_path'>;
  });
};

export const c_get_all_tags = async () => {
  return invoke('c_get_all_tags', {}).then((v) => v as ExtractIpcResponcesType<'c_get_all_tags'>);
};

export const c_get_all_folders = async () => {
  return invoke('c_get_all_folders').then((v) => {
    return v as ExtractIpcResponcesType<'c_get_all_folders'>;
  });
};

export const c_get_all_folders_by_schema = async (schemaPath: string) => {
  return invoke('c_get_all_folders_by_schema', { schemaPath }).then((v) => {
    return v as ExtractIpcResponcesType<'c_get_all_folders_by_schema'>;
  });
};

export type BookReadResult = {
  book: RecordFromDb;
  // This error happens when file is read, but metadata parsing encountered error.
  // Book will default to empty values, except for path, markdown and modified.
  parsing_error?: ErrFR;
  schema: Schema;
};

export const c_read_file_by_path = async (path: string) => {
  return invoke('c_read_file_by_path', { path }).then(
    (v) => v as ExtractIpcResponcesType<'c_read_file_by_path'>,
  );
};

// Retrieve all cached schemas from memory
export const c_get_schemas_usable = async () => {
  return invoke('c_get_schemas_usable').then(
    (v) => v as ExtractIpcResponcesType<'c_get_schemas_usable'>,
  );
};

export const c_get_schemas_all = async () => {
  return invoke('c_get_schemas_all').then((v) => v as ExtractIpcResponcesType<'c_get_schemas_all'>);
};

export const c_save_schema = async (path: string, schema: Schema) => {
  return invoke('c_save_schema', { path, schema }).then(
    (v) => v as ExtractIpcResponcesType<'c_save_schema'>,
  );
};

// All schema.yaml files we can find
export const c_load_schema = async (path: string) => {
  return invoke('c_load_schema', { path }).then(
    (v) => v as ExtractIpcResponcesType<'c_load_schema'>,
  );
};

export const c_resolve_schema_path = async (path: string) => {
  if (!path) {
    return null as ExtractIpcResponcesType<'c_resolve_schema_path'>;
  }

  return invoke('c_resolve_schema_path', { path }).then(
    (v) => v as ExtractIpcResponcesType<'c_resolve_schema_path'>,
  );
};

// Moves file to recycle bin. Works with folders too
export const c_delete_to_trash = async (path: string) => {
  return invoke('c_delete_to_trash', { path }).then(
    (v) => v as ExtractIpcResponcesType<'c_delete_to_trash'>,
  );
};
