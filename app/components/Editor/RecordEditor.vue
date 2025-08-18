<template>
  <div
    ref="scrollElement"
    class="h-full flex flex-col w-full pb-4 bg-background overflow-y-auto scrollbarMod gutter-stable px-4"
  >
    <div class="max-w-2xl mx-auto w-full">
      <template v-if="!editMode">
        <BreadcrumbList
          class="flex gap-2 flex-nowrap shrink py-2 rounded-b-md z-10 sticky top-0 bg-background"
        >
          <template v-if="!breadcrumbItems.all">
            <BreadcrumbItem
              class="w-fit block whitespace-nowrap overflow-ellipsis overflow-hidden"
              :class="'shrink cursor-pointer'"
              @click="
                ts.openNewThingFast({ _type: 'folder', _path: breadcrumbItems.start[0].path })
              "
            >
              {{ breadcrumbItems.start[0].label }}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem> ... </BreadcrumbItem>
            <template v-for="(item, i) in breadcrumbItems.end">
              <BreadcrumbSeparator />

              <BreadcrumbItem
                class="w-fit block whitespace-nowrap overflow-ellipsis overflow-hidden max-w-64"
                :class="i === breadcrumbItems.end.length - 1 ? 'shrink' : 'shrink-3 cursor-pointer'"
                @click="
                  i !== breadcrumbItems.end.length - 1 &&
                  ts.openNewThingFast({ _type: 'folder', _path: item.path })
                "
              >
                {{ item.label }}
              </BreadcrumbItem>
            </template>
          </template>

          <template v-if="breadcrumbItems.all">
            <template v-for="(item, i) in breadcrumbItems.all">
              <BreadcrumbSeparator v-if="i > 1" />

              <BreadcrumbItem
                class="w-fit block whitespace-nowrap overflow-ellipsis overflow-hidden"
                :class="i === breadcrumbItems.all.length - 1 ? 'shrink' : 'shrink-3 cursor-pointer'"
                @click="
                  i !== breadcrumbItems.all.length - 1 &&
                  ts.openNewThingFast({ _type: 'folder', _path: item.path })
                "
              >
                {{ item.label }}
              </BreadcrumbItem>
            </template>
          </template>

          <div class="grow"></div>
          <DropdownMenu class="ml-auto">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="icon">
                <EllipsisVerticalIcon :size="14" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="editMode = true">
                <EditIcon /> Edit Layout
              </DropdownMenuItem>
              <DropdownMenuItem @click="startRename"> <PencilIcon /> Rename </DropdownMenuItem>
              <DropdownMenuItem @click="deleteDialog = true">
                <Trash2Icon /> Delete
              </DropdownMenuItem>

              <DropdownMenuItem
                @click="
                  viewSettingsUpdater('labelsHidden', !viewSettingsQ.data.value?.labelsHidden)
                "
              >
                <EyeIcon /> {{ viewSettingsQ.data.value?.labelsHidden ? 'Show' : 'Hide' }} Labels
              </DropdownMenuItem>

              <DropdownMenuItem
                v-if="viewSettingsQ.data.value?.layoutWarningsHidden"
                @click="
                  viewSettingsUpdater(
                    'layoutWarningsHidden',
                    !viewSettingsQ.data.value?.layoutWarningsHidden,
                  )
                "
              >
                <EyeIcon /> {{ viewSettingsQ.data.value?.layoutWarningsHidden ? 'Show' : 'Hide' }}
                warnings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbList>
      </template>

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
        You have {{ inviSchemaItms.length }} item{{ inviSchemaItms.length === 1 ? '' : 's' }}
        in schema that are not visible in the view:
        <br />
        <span class="cursor-pointer underline ml-4" @click="editMode = true">Edit Layout</span>
        <span
          class="cursor-pointer underline ml-4"
          @click="viewSettingsUpdater('layoutWarningsHidden', true)"
          >Hide
        </span>
      </div>

      <MetaEditor
        v-if="editableProxy && schema && viewLayoutQ.data.value"
        v-model:opened-file="editableProxy.record"
        :view-layout="viewLayoutQ.data.value"
        :hide-labels="viewSettingsQ.data.value?.labelsHidden"
        @update:layout="
          (v) => {
            updateViewLayout(v);
            editMode = false;
          }
        "
        @edit-mode="editMode = true"
        @discard="
          () => {
            console.log('discard');
            editMode = false;
          }
        "
        :edit-mode="editMode"
        :schema="schema.schema"
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
import { EditIcon, EllipsisVerticalIcon, EyeIcon, PencilIcon, Trash2Icon } from 'lucide-vue-next';

import path from 'path-browserify';
import type { PropType } from 'vue';

import { path as tauriPath } from '@tauri-apps/api';
import { c_delete_to_trash } from '~/api/tauriActions';
import {
  useScrollRestorationOnMount,
  useScrollWatcher,
  useTabsStoreV2,
  type IOpenedFile,
} from '~/composables/stores/useTabsStoreV2';
import type { IDynamicItem } from '../DynamicView/helpers';
import MetaEditor from './MetaEditor.vue';

const separator = tauriPath.sep();

const props = defineProps({
  opened: {
    type: Object as PropType<IOpenedFile>,
    required: true,
  },
});

const breadcrumbItems = computed(() => {
  const rootFolder = fileQ.data.value?.schema.owner_folder ?? '';

  const realPath = props.opened._path.replace(rootFolder, '');

  const all = [{ label: path.basename(rootFolder), path: rootFolder }];

  for (const item of realPath.split(separator)) {
    all.push({
      label: item,
      path: path.join(all[all.length - 1].path, item),
    });
  }

  if (all.length > 4) {
    return {
      start: [all[0]],
      middle: all.slice(1, all.length - 3),
      end: [all[all.length - 2], all[all.length - 1]],
    };
  }

  return { all };
});

const editorWrapper = useTemplateRef('editorWrapper');

const colorMode = useColorMode();

const editMode = ref(false);
const deleteDialog = ref(false);
const renameDialog = ref(false);
const newName = ref('');

const startRename = () => {
  renameDialog.value = true;
  newName.value = path.basename(props.opened._path, path.extname(props.opened._path));
};

const {
  fileQ,
  editableProxy,
  performUpdate,
  viewSettingsQ,
  viewSettingsUpdater,
  viewLayoutQ,
  updateViewLayout,
  onRename,
} = useFileEditorV2(props.opened, editorWrapper);

const schema = computed(() => fileQ.data.value?.schema);

const scrollElement = useTemplateRef('scrollElement');
useScrollWatcher(scrollElement);
useScrollRestorationOnMount(
  scrollElement,
  computed(() => !!fileQ.data.value),
);

const ts = useTabsStoreV2();

const onRemove = async () => {
  await c_delete_to_trash(props.opened._path);
  ts.openNewThingFast({ _type: 'folder', _path: path.dirname(props.opened._path) });
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

const inviSchemaItms = computed(() => {
  if (!schema.value) return [];
  return (
    schema.value?.schema.items
      .filter((item) => !viewLayoutKeys.value[item.name])
      .map((item) => item.name) ?? []
  );
});
const showLayoutWarning = computed(() => {
  return (
    !viewSettingsQ.data.value?.layoutWarningsHidden &&
    inviSchemaItms.value.length &&
    !editMode.value
  );
});
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
