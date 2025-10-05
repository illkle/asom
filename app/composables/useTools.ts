import { platform } from '@tauri-apps/plugin-os';

export const useFileManagerName = () => {
  const isPreviewMode = inject<boolean>('PREVIEW_MODE');
  if (isPreviewMode) return computed(() => 'Preview');

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

export const useIsMac = () => {
  const currentPlatform = platform();
  return computed(() => currentPlatform === 'macos');
};
