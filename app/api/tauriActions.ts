import { invoke } from '@tauri-apps/api/core';
import { showErrorNotification } from '~/components/Core/Errors/errors';
import type { ExtractIpcResponseType, RecordFromDb, Schema } from '~/types';

export const c_init = async () => {
  return invoke('c_init').then((v) => v as ExtractIpcResponseType<'c_init'>);
};

export const c_get_root_path = async () => {
  return invoke('c_get_root_path').then((v) => v as ExtractIpcResponseType<'c_get_root_path'>);
};

export const c_save_file = async ({
  record,
  forced = false,
  createNew = false,
}: {
  record: RecordFromDb;
  /** Will write file event if modified from passed record is lower that on disk  */
  forced?: boolean;
  /** Ensures unique filename for file and skips modified check */
  createNew?: boolean;
}) => {
  return invoke('c_save_file', { record, forced, createNew })
    .then((v) => v as ExtractIpcResponseType<'c_save_file'>)
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

// oxlint-disable-next-line no-unused-vars
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const c_get_files_by_path = async (pathRelative: string) => {
  console.log(' c_get_files_by_path', pathRelative);
  return invoke('c_get_files_by_path', { pathRelative })
    .then((v) => {
      return v as ExtractIpcResponseType<'c_get_files_by_path'>;
    })
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

export const c_get_all_tags = async () => {
  return invoke('c_get_all_tags', {})
    .then((v) => v as ExtractIpcResponseType<'c_get_all_tags'>)
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

export const c_get_all_folders = async () => {
  return invoke('c_get_all_folders')
    .then((v) => {
      return v as ExtractIpcResponseType<'c_get_all_folders'>;
    })
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

export const c_get_all_folders_by_schema = async (schemaPath: string) => {
  return invoke('c_get_all_folders_by_schema', { schemaPath })
    .then((v) => {
      return v as ExtractIpcResponseType<'c_get_all_folders_by_schema'>;
    })
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

export const c_read_file_by_path = async (path: string) => {
  return invoke('c_read_file_by_path', { path })
    .then((v) => v as ExtractIpcResponseType<'c_read_file_by_path'>)
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

// Retrieve all cached schemas from memory
export const c_get_schemas_usable = async () => {
  return invoke('c_get_schemas_usable')
    .then((v) => v as ExtractIpcResponseType<'c_get_schemas_usable'>)
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

export const c_get_schemas_all = async () => {
  return invoke('c_get_schemas_all')
    .then((v) => v as ExtractIpcResponseType<'c_get_schemas_all'>)
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

export const c_save_schema = async (path: string, schema: Schema) => {
  return invoke('c_save_schema', { path, schema })
    .then((v) => v as ExtractIpcResponseType<'c_save_schema'>)
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

// All schema.yaml files we can find
export const c_load_schema = async (path: string) => {
  return invoke('c_load_schema', { path })
    .then((v) => v as ExtractIpcResponseType<'c_load_schema'>)
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

export const c_resolve_schema_path = async (path: string) => {
  if (!path) {
    return null as ExtractIpcResponseType<'c_resolve_schema_path'>;
  }

  return invoke('c_resolve_schema_path', { path })
    .then((v) => v as ExtractIpcResponseType<'c_resolve_schema_path'>)
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};

// Moves file to recycle bin. Works with folders too
export const c_delete_to_trash = async (path: string) => {
  return invoke('c_delete_to_trash', { path })
    .then((v) => v as ExtractIpcResponseType<'c_delete_to_trash'>)
    .catch((e) => {
      showErrorNotification(e);
      throw e;
    });
};
