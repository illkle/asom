<template>
  <div
    class="bg-card text-card-foreground w-full max-w-[400px] rounded-lg border-neutral-300 px-6 py-4 shadow-sm dark:border-neutral-600"
  >
    <div class="font-serif text-3xl">Initializing</div>

    <div class="mt-4 flex flex-col gap-3 font-light">
      <div v-for="(step, i) in steps" class="">
        <div
          class="flex justify-between border border-neutral-200 p-2 px-4 dark:border-neutral-800"
          :class="step.mutation.error.value && 'border-b-0'"
        >
          {{ step.name }}
          <div>
            <LoaderCircle
              v-if="step.mutation.status.value === 'pending' && running"
              class="animate-spin"
            />
            <XIcon v-else-if="step.mutation.status.value === 'error' && !running" class="" />
            <XIcon v-else-if="typeof step === 'object' && 'isError' in step" />
            <CheckIcon v-else />
          </div>
        </div>
        <div
          v-if="step.mutation.error.value"
          class="border border-neutral-300 p-4 dark:border-neutral-800"
        >
          <template v-if="isOurError(step.mutation.error.value)">
            <div class="text-regular font-bold">
              {{ step.mutation.error.value.title }}
            </div>
            <div v-if="'info' in step.mutation.error.value" class="mt-1 text-xs">
              {{ step.mutation.error.value.info }}
            </div>
            <div class="mt-4 flex gap-2">
              <ShButton
                v-if="'rawError' in step.mutation.error.value"
                variant="outline"
                @click="store.setError(step.mutation.error.value)"
                class="w-full"
              >
                Show full error</ShButton
              >
              <ShButton variant="outline" @click="initLoop" class="w-full">
                {{ 'Retry' }}
              </ShButton>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~~/utils/store';
import { CheckIcon, LoaderCircle, XIcon } from 'lucide-vue-next';
import {
  c_get_schemas,
  c_init_once,
  c_load_schemas,
  c_prepare_cache,
  c_watch_path,
  returnErrorHandler,
} from '~/api/tauriActions';
import type { ErrorFromRust } from '~/types';
import { isOurError } from '~/api/tauriEvents';

const store = useStore();

const running = ref(false);

const stopRunning = () => {
  running.value = false;
};

const initMutation = useMutation({
  mutation: c_init_once,
  onError: stopRunning,
  onSuccess: async () => {
    await store.fetchRootPath();
    if (typeof store.rootPath !== 'string') {
      await navigateTo('/welcome', { replace: true });
      running.value = false;
      return;
    }

    cacheMutation.mutate();
  },
});

const cacheMutation = useMutation({
  mutation: c_prepare_cache,
  onError: stopRunning,
  onSuccess: async () => {
    await watcherMutation.mutate();
  },
});

const watcherMutation = useMutation({
  mutation: c_watch_path,
  onError: stopRunning,
  onSuccess: async () => {
    await navigateTo('/application', { replace: true });
  },
});

const steps = [
  {
    name: 'Initialize',
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

const initLoop = async () => {
  running.value = true;
  steps.find((s) => s.mutation.status.value !== 'success')?.mutation.mutate();
};

onMounted(() => {
  initLoop();
});
</script>
