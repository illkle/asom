import * as path from 'path';
import FileService from '../services/files';
import GlobalSettings from '../services/globalSettings';

import type { ISavedFile } from '../services/files';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IIpcHandle = (...args: any) => any;

type IHandles = {
  [key: string]: IIpcHandle;
};

///
/// Files
///
const getFileTree: IIpcHandle = async (_, path = './files') => {
  console.log(path);
  const files = await FileService.getFileTree(path);
  return files;
};

const loadFilesFromFolder: IIpcHandle = async (_, path: string, recursive = false) => {
  const files = await FileService.loadFilesFromFolder(path, recursive);
  FileService.theWatcher.loadedPath = { path, recursive };
  return files;
};

const saveFileContent: IIpcHandle = async (_, file: ISavedFile) => {
  const currentTime = new Date();

  FileService.theWatcher.filesIgnore[file.path] = new Date(currentTime.getTime() + 3000);

  await FileService.saveFileContent(file);
};

const closeWatcher: IIpcHandle = async () => {
  await FileService.theWatcher.destroy();
};

const move: IIpcHandle = async (_, srcPath: string, targetPath: string) => {
  // TargetPath we get looks like 'pathto/folder' where we want to place src. fs.move wants 'pathto/folder/fileName.md'
  targetPath = path.join(targetPath, path.basename(srcPath));

  await FileService.move(srcPath, targetPath);
  return targetPath;
};

const rename: IIpcHandle = async (_, srcPath: string, newName: string) => {
  const onlyDir = path.dirname(srcPath);
  const targetPath = path.join(onlyDir, newName);
  await FileService.move(srcPath, targetPath);
  return targetPath;
};

///
/// Core
///
const init: IIpcHandle = async () => {
  const rootPath = GlobalSettings.getRootPath();
  if (rootPath) {
    FileService.theWatcher.init(rootPath);
    return true;
  } else {
    return false;
  }
};

const newRootPath: IIpcHandle = async () => {
  try {
    await GlobalSettings.setRootPath();
    return true;
  } catch (e) {
    return false;
  }
};

const handles: IHandles = {
  getFileTree,
  loadFilesFromFolder,
  saveFileContent,
  closeWatcher,
  move,
  rename,

  init,
  newRootPath,
};

export default handles;
