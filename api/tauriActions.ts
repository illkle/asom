import {
  isOurError,
  type ErrorFromRust,
  type IBookFromDb,
  type Schema,
  type SchemaItem,
} from '~/api/tauriEvents';
import { invoke } from '@tauri-apps/api/core';

const errorHandler = (e: unknown): ErrorFromRust => {
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
  } as ErrorFromRust;
};

export const c_init_once = async () => {
  return invoke('c_init_once')
    .then((v) => v as boolean)
    .catch(errorHandler);
};

export const c_prepare_cache = async () => {
  return invoke('c_prepare_cache')
    .then((v) => v as boolean)
    .catch(errorHandler);
};

export const c_watch_path = async () => {
  return invoke('c_watch_path')
    .then((v) => v as boolean)
    .catch(errorHandler);
};

export type IBookSaveResult = {
  path: string;
  modified: string;
};

/**
 *  When forced set to false will return error if
 *  1. Book.modified is not null but is not equal to file last modified
 *  2. File does not exist already.
 */
export const c_save_file = async (book: IBookFromDb, forced = false) => {
  return invoke('c_save_file', { book, forced })
    .then((v) => v as IBookSaveResult)
    .catch(errorHandler);
};

export type BookListGetResult = {
  schema: Schema;
  books: IBookFromDb[];
};

export const c_get_files_path = async (path: string) => {
  return invoke('c_get_files_path', { path })
    .then((v) => v as BookListGetResult)
    .catch(errorHandler);
};

export const c_get_all_tags = async () => {
  return invoke('c_get_all_tags', {})
    .then((v) => v as string[])
    .catch(errorHandler);
};

export const c_get_all_folders = async () => {
  return invoke('c_get_all_folders', {})
    .then((v) => v as string[])
    .catch(errorHandler);
};

export type BookReadResult = {
  book: IBookFromDb;
  // This error happens when file is read, but metadata parsing encountered error.
  // Book will default to empty values, except for path, markdown and modified.
  parsing_error?: ErrorFromRust;
  schema: Schema;
};

export const c_read_file_by_path = async (path: string) => {
  return invoke('c_read_file_by_path', { path })
    .then((v) => v as BookReadResult)
    .catch(errorHandler);
};

export type SchemaLoadList = {
  schemas: Schema[];
  error?: ErrorFromRust;
};

export const c_load_schemas = async (path: string) => {
  return invoke('c_load_schemas', { path })
    .then((v) => v as SchemaLoadList)
    .catch(errorHandler);
};

export const c_save_schema = async (path: string, schema: Schema) => {
  return invoke('c_save_schema', { path, schema })
    .then((v) => v as Schema)
    .catch(errorHandler);
};
