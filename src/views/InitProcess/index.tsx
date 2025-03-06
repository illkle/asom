import { For, Match, onMount, Show, Switch } from 'solid-js';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { createMutation } from '@tanstack/solid-query';
import { LoaderCircleIcon, XIcon, CheckIcon } from 'lucide-solid';
import { c_init_once, c_prepare_cache, c_watch_path } from '~/api/tauriActions';

import { isOurErrorReturning } from '~/api/tauriEvents';

const StepStatus = ({
  status,
  name,
  running,
}: {
  status: 'pending' | 'error' | 'success' | 'idle';
  name: string;
  running: boolean;
}) => {
  return (
    <div
      class={cn(
        'flex justify-between border border-neutral-200 p-2 px-4 dark:border-neutral-800',
        status === 'error' && 'border-b-0'
      )}
    >
      {name} {status}
      <div>
        <Switch>
          <Match when={status === 'pending' && running}>
            <LoaderCircleIcon class="animate-spin" />
          </Match>
          <Match when={status === 'error'}>
            <XIcon />
          </Match>
          <Match when={status !== 'idle'}>
            <CheckIcon />
          </Match>
        </Switch>
      </div>
    </div>
  );
};

const StepError = ({ error }: { error: Error }) => {
  const ourErr = isOurErrorReturning(error);

  return (
    <>
      <Switch>
        <Match when={ourErr}>
          <div>
            <div class="text-regular font-bold">{ourErr?.title}</div>
            <Show when={ourErr?.info}>
              <div class="mt-1 text-xs">{ourErr?.info}</div>
            </Show>
            <div class="mt-4 flex gap-2">
              <Button
                v-if="'rawError' in step.mutation.error.value"
                variant="outline"
                class="w-full"
              >
                Show full error
              </Button>
              <Button variant="outline" class="w-full">
                Retry
              </Button>
            </div>
          </div>
        </Match>
        <Match when={true}>
          <div>
            <div>Unknown error</div>
            <div>{error.message}</div>
            <div>{error.stack}</div>
          </div>
        </Match>
      </Switch>
    </>
  );
};

const InitProcess = () => {
  const initMutation = createMutation(() => ({
    mutationFn: c_init_once,
    onSuccess: async () => {
      console.log('init success');
      await cacheMutation.mutate();
    },
  }));

  const cacheMutation = createMutation(() => ({
    mutationFn: c_prepare_cache,
    onSuccess: async () => {
      await watcherMutation.mutate();
    },
  }));

  const watcherMutation = createMutation(() => ({
    mutationFn: c_watch_path,
    onSuccess: async () => {
      console.log('init done');
      // await navigateTo('/application', { replace: true });
    },
  }));

  const steps = [
    {
      name: 'Initializing',
      mutation: initMutation,
    },
    {
      name: 'Setup cache',
      mutation: cacheMutation,
    },

    {
      name: 'Start watcher',
      mutation: watcherMutation,
    },
  ];

  const running = () => initMutation.isPending;

  onMount(() => {
    console.log('init mount');
    initMutation.mutate();
  });

  return (
    <div class="bg-card text-card-foreground w-full max-w-[400px] rounded-lg border-neutral-300 px-6 py-4 shadow-sm dark:border-neutral-600">
      <div class="font-serif text-3xl">Initializing</div>

      <div class="mt-4 flex flex-col gap-3 font-light">
        <For each={steps}>
          {(step) => (
            <>
              {step.mutation.status}
              <StepStatus
                status={step.mutation.status}
                name={step.name}
                running={running()}
              />

              <Show when={step.mutation.error}>
                {(nn) => <StepError error={nn()} />}
              </Show>
            </>
          )}
        </For>
      </div>
    </div>
  );
};

export default InitProcess;
