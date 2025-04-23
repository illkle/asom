<template>
  <div class="flex w-full flex-col overscroll-none px-4">
    <div class="mx-auto h-fit w-full max-w-2xl">
      <div class="sticky top-0 z-10" v-if="false">
        {{ new Date(fileQ.data.value?.record.modified ?? 0).toLocaleString() }}
        <br />
        {{ lastSyncedTimestamp.toLocaleString() }}
        <br />
        {{ changesTracker }}
      </div>
      <EditorMetaEditor
        v-if="editableProxy && schema"
        v-model="editableProxy.record"
        :schema="schema.schema"
        class="py-2"
      />

      <div class="h-full min-h-[200px] border-t py-4">
        <div
          ref="editorWrapper"
          class="editorRoot editorStyling h-full"
          :class="colorMode.value === 'dark' && 'dark'"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { useScrollRestorationOnMount, type IOpenedFile } from '~/composables/stores/useTabsStoreV2';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedFile>,
    required: true,
  },
});

const editorWrapper = useTemplateRef('editorWrapper');

const colorMode = useColorMode();

const {
  fileQ,
  editableProxy,
  performUpdate,
  viewSettingsQ,
  viewSettingsUpdater,
  changesTracker,
  lastSyncedTimestamp,
} = useFileEditorV2(props.opened, editorWrapper);

const schema = computed(() => fileQ.data.value?.schema);

useScrollRestorationOnMount(computed(() => !!fileQ.data.value));
</script>

<style scoped>
.customTopGrid {
  grid-template-columns: minmax(min-content, max-content) 3fr 1fr;
}

.editorRoot {
  /* Neutral */
  --neutral-50: hsl(0 0% 98%);
  --neutral-100: hsl(0 0% 96.1%);
  --neutral-200: hsl(0 0% 89.8%);
  --neutral-300: hsl(0 0% 83.1%);
  --neutral-400: hsl(0 0% 63.9%);
  --neutral-500: hsl(0 0% 45.1%);
  --neutral-600: hsl(0 0% 32.2%);
  --neutral-700: hsl(0 0% 25.1%);
  --neutral-800: hsl(0 0% 14.9%);
  --neutral-900: hsl(0 0% 9%);
  --neutral-950: hsl(0 0% 3.9%);
}

.editorStyling {
  --text: var(--neutral-950);
  --cursor: var(--neutral-800);
  --selection: var(--neutral-300);

  --fold: var(--neutral-800);
}

.dark.editorStyling {
  --text: var(--neutral-50);
  --cursor: var(--neutral-200);
  --selection: var(--neutral-800);
  --fold: var(--neutral-200);
}
</style>
