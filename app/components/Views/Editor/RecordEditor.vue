<template>
  <div
    ref="scrollElement"
    class="h-full flex flex-col w-full pb-4 bg-background overflow-y-auto scrollbarMod gutter-stable px-4"
  >
    <div v-if="somethingPending">
      <div class="w-full h-full flex items-center justify-center py-16">
        <LoaderAnimated class="text-muted-foreground" />
      </div>
    </div>
    <div v-else class="max-w-3xl mx-auto w-full">
      <div
        class="grid grid-cols-[4fr_min-content] w-full gap-2 py-2 rounded-b-md z-10 sticky top-0 bg-background"
      >
        <BreadCrumbsList
          v-if="fileQ.data.value?.breadcrumb_items"
          :breadcrumb-items="fileQ.data.value?.breadcrumb_items"
        />

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <EllipsisVerticalIcon :size="14" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="openEditMode"> <EditIcon /> Edit Layout </DropdownMenuItem>
            <DropdownMenuItem @click="startRename"> <PencilIcon /> Rename </DropdownMenuItem>
            <DropdownMenuItem
              @click="showInFileManager({ rootPath, targetPath: props.opened._path, reveal: true })"
            >
              <FolderIcon /> Reveal in {{ fileManager }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="deleteDialog = true">
              <Trash2Icon /> Delete
            </DropdownMenuItem>

            <DropdownMenuItem v-if="hasApi" @click="fillFromApiDialog = true">
              <CloudDownload /> Fill from API
            </DropdownMenuItem>

            <DropdownMenuItem
              @click="
                viewSettingsUpdaterPartial({
                  labelsHidden: !viewSettingsQ.data.value?.labelsHidden,
                })
              "
            >
              <EyeIcon /> {{ viewSettingsQ.data.value?.labelsHidden ? 'Show' : 'Hide' }} Labels
            </DropdownMenuItem>

            <DropdownMenuItem
              v-if="viewSettingsQ.data.value?.layoutWarningsHidden"
              @click="
                viewSettingsUpdaterPartial({
                  layoutWarningsHidden: !viewSettingsQ.data.value?.layoutWarningsHidden,
                })
              "
            >
              <EyeIcon /> {{ viewSettingsQ.data.value?.layoutWarningsHidden ? 'Show' : 'Hide' }}
              warnings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AddAndSearch
        v-if="schema"
        v-model:opened="fillFromApiDialog"
        :selected-schema="schema.schema"
        :selected-schema-path="schema.location.schema_owner_folder"
        @handle-add-from-api="
          (_, attrs) => {
            if (!editableProxy) return;
            editableProxy.record.record.attrs = {
              ...editableProxy.record.record.attrs,
              ...attrs,
            };
            fillFromApiDialog = false;
          }
        "
      />

      <Dialog v-model:open="renameDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>

          <div class="flex gap-2 items-center font-mono">
            <Input v-model="newName" autofocus /> .md
          </div>

          <DialogFooter class="flex gap-2">
            <DialogClose as-child>
              <Button variant="outline" class="grow">Cancel</Button>
            </DialogClose>
            <Button class="grow" @click="onRename(newName)">Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog v-model:open="deleteDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete</DialogTitle>
          </DialogHeader>
          <DialogDescription> Are you sure you want to delete this item? </DialogDescription>
          <DialogFooter class="flex gap-2">
            <DialogClose as-child>
              <Button variant="outline" class="grow">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" class="grow" @click="onRemove">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div v-if="showLayoutWarning" class="text-xs text-muted-foreground p-1 flex">
        You have {{ invisibleSchemaItems.length }} item{{
          invisibleSchemaItems.length === 1 ? '' : 's'
        }}
        in schema that are not visible in the view:
        <br />
        <span class="cursor-pointer underline ml-4" @click="openEditMode">Edit Layout</span>
        <span
          class="cursor-pointer underline ml-4"
          @click="viewSettingsUpdaterPartial({ layoutWarningsHidden: true })"
          >Hide
        </span>
      </div>

      <MetaEditor
        v-if="editableProxy && schema && viewLayoutQ.data.value"
        v-model:opened-file="editableProxy.record.record"
        :view-layout="viewLayoutQ.data.value"
        :hide-labels="viewSettingsQ.data.value?.labelsHidden"
        :schema="schema.schema"
        @open-edit-mode="openEditMode"
        class="py-2"
      />

      <div
        ref="editorWrapper"
        class="editorRoot editorStyling grow pt-2 border-t min-h-64"
        :class="colorMode.value === 'dark' && 'dark'"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  CloudDownload,
  EditIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  FolderIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-vue-next';

import type { PropType } from 'vue';

import { path as tauriPath } from '@tauri-apps/api';
import { c_delete_to_trash } from '~/api/tauriActions';
import LoaderAnimated from '~/components/Modules/LoaderAnimated.vue';
import { useRootPathInjectSafe } from '~/composables/data/providers';
import {
  useScrollRestorationOnMount,
  useScrollWatcher,
  useTabsStoreV2,
  type IOpened,
} from '~/composables/stores/useTabsStoreV2';
import type { IDynamicItem } from '../../Modules/DynamicView/helpers';
import AddAndSearch from '../Add/AddAndSearch.vue';
import BreadCrumbsList from './BreadCrumbsList.vue';
import MetaEditor from './MetaEditor.vue';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});

const editorWrapper = useTemplateRef('editorWrapper');

const colorMode = useColorMode();

const deleteDialog = ref(false);
const renameDialog = ref(false);
const newName = ref('');

const startRename = async () => {
  renameDialog.value = true;
  newName.value = await tauriPath.basename(
    props.opened._path,
    await tauriPath.extname(props.opened._path),
  );
};

const {
  fileQ,
  editableProxy,
  viewSettingsQ,
  viewLayoutQ,
  onRename,
  viewSettingsUpdaterPartial,
  somethingPending,
  lastSyncedTimestamp,
} = useFileEditorV2(props.opened, editorWrapper);

const schema = computed(() => fileQ.data.value?.record.schema);

const scrollElement = useTemplateRef('scrollElement');
useScrollWatcher(scrollElement);
useScrollRestorationOnMount(
  scrollElement,
  computed(() => !!fileQ.data.value),
);

const ts = useTabsStoreV2();

const onRemove = async () => {
  await c_delete_to_trash(props.opened._path);
  ts.openNewThingFast({ _type: 'folder', _path: await tauriPath.dirname(props.opened._path) });
};

const markKey = (item: IDynamicItem, toSave: Record<string, boolean>) => {
  toSave[item.id] = true;

  if (item.type === 'group') {
    for (const child of item.content) {
      markKey(child, toSave);
    }
  }
};

const viewLayoutKeys = computed(() => {
  const hasKey: Record<string, boolean> = {};
  if (!viewLayoutQ.data.value) return {};
  markKey(viewLayoutQ.data.value, hasKey);
  return hasKey;
});

const invisibleSchemaItems = computed(() => {
  if (!schema.value) return [];
  return (
    schema.value?.schema.items
      .filter((item) => !viewLayoutKeys.value[item.name])
      .map((item) => item.name) ?? []
  );
});
const showLayoutWarning = computed(() => {
  return !viewSettingsQ.data.value?.layoutWarningsHidden && invisibleSchemaItems.value.length;
});

const apiConnection = useApiConnection(
  computed(() => schema.value?.location.schema_owner_folder ?? ''),
);
const hasApi = computed(() => {
  return apiConnection.q.data?.value && apiConnection.q.data.value.type !== 'none';
});

const fillFromApiDialog = ref(false);

const openEditMode = () => {
  if (!schema.value?.location.schema_owner_folder) return;
  ts.openNewThingFast(
    { _type: 'settings/layout', _path: schema.value.location.schema_owner_folder },
    'last',
  );
};

const fileManager = useFileManagerName();
const rootPath = useRootPathInjectSafe();
</script>

<style>
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

.editorStyling .cm-editor {
  height: 100%;
}

.dark.editorStyling {
  --text: var(--neutral-50);
  --cursor: var(--neutral-200);
  --selection: var(--neutral-800);
  --fold: var(--neutral-200);
}
</style>
