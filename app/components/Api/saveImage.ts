import { copyFile, exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';

import { path } from '@tauri-apps/api';
import { open } from '@tauri-apps/plugin-dialog';

const prepareFolderFile = async (rootPath: string, desiredName: string) => {
  const folder = await path.join(rootPath, '.assets');

  const folderExists = await exists(folder);
  if (!folderExists) {
    await mkdir(folder, { recursive: true });
  }

  const fileName = `${desiredName}-${generateUniqId()}.jpg`;

  const imagePath = await path.join(folder, fileName);

  return { imagePath, fileName };
};

export const saveImageFromUrl = async (
  imageUrl: string,
  rootPath: string,
  recordName: string,
): Promise<string> => {
  const image = await fetch(imageUrl);

  const imageBlob = await image.blob();

  const imageBuffer = await imageBlob.arrayBuffer();
  const { imagePath, fileName } = await prepareFolderFile(rootPath, recordName);

  await writeFile(imagePath, new Uint8Array(imageBuffer));

  return fileName;
};

export const saveImageFromSelection = async (rootPath: string, desiredName: string) => {
  const result = await open({
    multiple: false,
    directory: false,
  });

  if (!result) return null;

  const { imagePath, fileName } = await prepareFolderFile(rootPath, desiredName);

  await copyFile(result, imagePath);

  return fileName;
};
