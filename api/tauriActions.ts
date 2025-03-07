import { isOurError, rustErrorNotification } from '~/api/tauriEvents';
import { invoke } from '@tauri-apps/api/core';
import type { ErrorFromRust, Schema, BookFromDb, ExtractIpcResponcesType } from '~/types';

export const returnErrorHandler = (e: unknown): ErrorFromRust => {
  if (isOurError(e)) {
    console.error('Error from rust', e);

    if (e.actionCode === 'NoRootPath') {
      navigateTo('/');
    }

    return e;
  }
  console.error(e);
  return {
    title: 'Unknown Javascript or Tauri error',
    info: 'See console for more details',
  } as ErrorFromRust;
};

export const c_init_once = async () => {
  return invoke('c_init_once').then((v) => v as ExtractIpcResponcesType<'c_init_once'>);
};

export const c_prepare_cache = async () => {
  return invoke('c_prepare_cache').then((v) => v as ExtractIpcResponcesType<'c_prepare_cache'>);
};

export const c_watch_path = async () => {
  return invoke('c_watch_path').then((v) => v as ExtractIpcResponcesType<'c_watch_path'>);
};

/**
 *  When forced set to false will return error if
 *  1. Book.modified is not null but is not equal to file last modified
 *  2. File does not exist already.
 */
export const c_save_file = async (book: BookFromDb, forced = false) => {
  return invoke('c_save_file', { book, forced }).then(
    (v) => v as ExtractIpcResponcesType<'c_save_file'>,
  );
};

export const c_get_files_path = async (path: string, searchQuery: string) => {
  return invoke('c_get_files_path', { path, searchQuery }).then(
    (v) => v as ExtractIpcResponcesType<'c_get_files_path'>,
  );
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
  book: BookFromDb;
  // This error happens when file is read, but metadata parsing encountered error.
  // Book will default to empty values, except for path, markdown and modified.
  parsing_error?: ErrorFromRust;
  schema: Schema;
};

export const c_read_file_by_path = async (path: string) => {
  return invoke('c_read_file_by_path', { path }).then(
    (v) => v as ExtractIpcResponcesType<'c_read_file_by_path'>,
  );
};

// Retrieve all cached schemas from memory
export const c_get_schemas = async () => {
  return invoke('c_get_schemas').then((v) => v as ExtractIpcResponcesType<'c_get_schemas'>);
};

export const c_save_schema = async (folderName: string, schema: Schema) => {
  return invoke('c_save_schema', { folderName, schema }).then(
    (v) => v as ExtractIpcResponcesType<'c_save_schema'>,
  );
};

// All schema.yaml files we can find
export const c_load_schema = async (path: string) => {
  return invoke('c_load_schema', { path }).then(
    (v) => v as ExtractIpcResponcesType<'c_load_schema'>,
  );
};

export const c_get_default_schemas = () => {
  return invoke('c_get_default_schemas').then(
    (v) => v as ExtractIpcResponcesType<'c_get_default_schemas'>,
  );
};
