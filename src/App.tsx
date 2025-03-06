import { Toaster } from 'solid-sonner';
import {
  ColorModeProvider,
  ColorModeScript,
  createLocalStorageManager,
} from '@kobalte/core';
import { cn } from '~/lib/utils';
import ErrorModal from '~/components/Error/errorModal';
import Router from '~/Router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

function App() {
  const storageManager = createLocalStorageManager('vite-ui-theme');

  const qc = new QueryClient();

  return (
    <>
      <QueryClientProvider client={qc}>
        <ColorModeScript storageType={storageManager.type} />
        <ColorModeProvider storageManager={storageManager}>
          <div
            id="app"
            class={cn(
              'h-full min-h-screen w-full bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50',
              'overflow-hidden overscroll-none bg-gradient-to-t from-neutral-200 from-20% to-neutral-50 to-80% select-none dark:from-neutral-900 dark:to-neutral-950'
            )}
          >
            <Router />
            <Toaster />
            <ErrorModal />
            <div id="customTeleport" class="absolute top-[-1000px]"></div>
          </div>
        </ColorModeProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
