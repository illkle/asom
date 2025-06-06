import { platform } from '@tauri-apps/plugin-os';

export const useFileManagerName = () => {
  const currentPlatform = platform();
  return computed(() => {
    if (currentPlatform === 'macos') {
      return 'Finder';
    }

    if (currentPlatform === 'windows') {
      return 'Explorer';
    }

    return 'System File Manager';
  });
};
