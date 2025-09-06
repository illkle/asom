// based on https://github.com/alexgorbatchev/file-paths-to-tree/blob/master/src/index.ts
import { path } from '@tauri-apps/api';
import type { FolderListGetResult } from 'types';

export type FolderNode = {
  name: string;
  path: string;
  rawPath: string;
  children: FolderNode[];
  parent: FolderNode | null;
  hasSchema: boolean;
  ownSchema: boolean;
  schemaFilePath?: string;
};

/**
 * Takes a list of file path strings and turns it into a `Node[]`.
 */
export function filePathsToTree(paths: FolderListGetResult) {
  const separator = path.sep();

  const folders = paths.folders.reduce((currentResults, currentFolder) => {
    const pathParts = currentFolder.path_relative.split(separator);
    const byPath: Record<string, FolderNode> = {};

    pathParts.reduce((nodes, name, index, arr) => {
      let node: FolderNode | undefined = nodes.find((node) => node.name === name);
      const path = arr.slice(0, index + 1).join(separator);
      const parentPath = arr.slice(0, index).join(separator);

      if (!node) {
        node = {
          name,
          path,
          rawPath: currentFolder.path,
          parent: byPath[parentPath] ?? null,
          children: [],
          hasSchema: currentFolder.has_schema,
          ownSchema: currentFolder.own_schema,
          schemaFilePath: currentFolder.schema_file_path,
        };

        nodes.push(node);
      }

      byPath[path] = node;

      return node.children;
    }, currentResults);

    return currentResults;
  }, [] as FolderNode[]);

  console.log('folders', folders);

  return folders;
}

export const dropIfSingleFolder = (tree: FolderNode[]) => {
  if (tree.length === 1) {
    return tree[0]?.children ?? [];
  }
  return tree;
};
