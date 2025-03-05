// based on https://github.com/alexgorbatchev/file-paths-to-tree/blob/master/src/index.ts
import path from 'path-browserify';
import type { FolderListGetResult } from '~/src-tauri/bindings/FolderListGetResult';

export type FolderNode = {
  name: string;
  path: string;
  rawPath: string;
  children: FolderNode[];
  parent: FolderNode | null;
};

/**
 * Takes a list of file path strings and turns it into a `Node[]`.
 */
export function filePathsToTree(paths: FolderListGetResult, rootPath: string) {
  const results: FolderNode[] = [];

  const separator = path.sep;

  return paths.folders.reduce((currentResults, currentFolder) => {
    const pathParts = currentFolder.path.replace(rootPath, '').split(separator);
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
          parent: byPath[parentPath],
          children: [],
        };

        nodes.push(node);
      }

      byPath[path] = node;

      return node.children;
    }, currentResults);

    return currentResults;
  }, results);
}
