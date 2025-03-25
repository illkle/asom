<template>
  <div v-if="appState.status === 'noRootPath'" class="flex h-full flex-col justify-center p-10">
    <div class="text-3xl font-serif">To begin please set working directory</div>
    <div class="text-regular mt-2">Your files & settings will be saved there.</div>
    <ShButton variant="outline" class="mt-4" @click="selectAndSetRootPath">
      Set Working Directory
    </ShButton>
  </div>

  <div
    v-else-if="appState.status === 'zeroSchemas'"
    class="flex h-full flex-col justify-center p-10"
  >
    <h2 class="text-3xl font-serif">You do not have any schemas yet</h2>
    <div class="text-sm mt-2">Schema defines what data is tracked on your entries</div>

    <div class="mt-4">
      <h2 class="text-xl font-serif">Default schemas</h2>
      <div v-if="defaultSchemasQ.data.value" class="flex gap-2 justify-between mt-2">
        <ShButton
          v-for="schema in defaultSchemasQ.data.value"
          :key="schema.name"
          :variant="selectedDefaults[schema.name] ? 'default' : 'outline'"
          class="w-full"
          @click="selectedDefaults[schema.name] = !selectedDefaults[schema.name]"
        >
          {{ schema.name }}
        </ShButton>
      </div>

      <ShButton
        variant=""
        class="mt-4 w-full"
        @click="createDefaultSchemas.mutate()"
        :disabled="!hasSelectedDefaults"
        >Create</ShButton
      >

      <ShButton variant="outline" class="mt-8 w-full" @click="navigateTo('/schemas')"
        >Open schemas editor</ShButton
      >
    </div>
  </div>

  <div
    v-else
    class="bg-card text-card-foreground w-full max-w-[400px] rounded-lg border-neutral-300 px-6 py-4 shadow-sm dark:border-neutral-600"
  >
    <div class="mt-4 flex flex-col gap-3 font-light">
      <div>
        <div
          class="flex justify-between items-center border border-neutral-200 p-2 px-4 dark:border-neutral-800"
          :class="appState.error && 'border-b-0'"
        >
          <div class="font-serif text-xl">Initializing...</div>
          <div>
            <LoaderCircle v-if="appState.status === 'pending'" class="animate-spin" />
            <XIcon v-else-if="appState.status === 'error'" class="" />
          </div>
        </div>
        <div v-if="appState.error" class="border border-neutral-300 p-4 dark:border-neutral-800">
          <template v-if="isOurError(appState.error)">
            <div class="text-regular font-bold">
              {{ appState.error.title }}
            </div>
            <div v-if="'info' in appState.error" class="mt-1 text-xs">
              {{ appState.error.info }}
            </div>
            <div class="mt-4 flex gap-2">
              <ShButton
                v-if="'rawError' in appState.error"
                variant="outline"
                @click="store.setError(appState.error)"
                class="w-full"
              >
                Show full error
              </ShButton>
            </div>
          </template>
          <template v-else>
            <div class="text-regular font-bold">Unexpected error</div>
            <div v-if="'info' in appState.error" class="mt-1 text-xs">
              {{ String(appState.error) }}
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { mkdir } from '@tauri-apps/plugin-fs';
import { LoaderCircle, XIcon } from 'lucide-vue-next';
import path from 'path-browserify';
import { selectAndSetRootPath } from '~/api/rootPath';
import { c_save_schema } from '~/api/tauriActions';
import { useDefaultSchemas } from '~/composables/queries';
import { useMainStore } from '~/composables/stores/useMainStore';
import { isOurError } from '~/composables/useRustErrorNotifcation';

const store = useMainStore();

const appState = useIsAppUsable();
const initQ = useRootPath();

const selectedDefaults = ref<Record<string, boolean>>({});

const defaultSchemasQ = useDefaultSchemas();

const hasSelectedDefaults = computed(() => {
  return Object.values(selectedDefaults.value).some((v) => v);
});

const createDefaultSchemas = useMutation({
  mutation: async () => {
    const schemasToCreate = defaultSchemasQ.data.value?.filter(
      (v) => selectedDefaults.value[v.name],
    );

    if (!schemasToCreate) throw new Error('No schemas to create');
    if (!initQ.data.value) throw new Error('No root path');

    for (const schema of schemasToCreate) {
      const folder = path.join(initQ.data.value, schema.name);
      await mkdir(folder, { recursive: true });
      await c_save_schema(folder, schema);
    }
  },
});
</script>
