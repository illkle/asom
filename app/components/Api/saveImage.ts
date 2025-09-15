import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import path from 'path-browserify';

export const saveImage = async (
  imageUrl: string,
  rootPath: string,
  recordName: string,
): Promise<string> => {
  const folder = path.join(rootPath, '.assets');

  const folderExists = await exists(folder);
  if (!folderExists) {
    await mkdir(folder, { recursive: true });
  }

  const fileName = `${recordName}-${generateUniqId()}.jpg`;

  const image = await fetch(imageUrl);

  const imageBlob = await image.blob();

  const imageBuffer = await imageBlob.arrayBuffer();

  const imagePath = path.join(folder, fileName);

  await writeFile(imagePath, new Uint8Array(imageBuffer));

  return fileName;
};
