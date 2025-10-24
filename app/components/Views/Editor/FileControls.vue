<template>
  <div
    class="grid grid-cols-[4fr_min-content] shadow-md shadow-background w-full gap-2 py-2 z-10 sticky top-0 bg-background"
  >
    <BreadCrumbsList
      v-if="fileEditor.fileQ.data.value?.breadcrumb_items"
      :breadcrumb-items="fileEditor.fileQ.data.value?.breadcrumb_items"
    />

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="sm">
          <EllipsisVerticalIcon :size="14" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @click="emit('openEditMode')">
          <EditIcon /> Edit Layout
        </DropdownMenuItem>
        <DropdownMenuItem @click="startRename"> <PencilIcon /> Rename </DropdownMenuItem>
        <DropdownMenuItem
          @click="showInFileManager({ rootPath, targetPath: props.opened._path, reveal: true })"
        >
          <FolderIcon /> Reveal in {{ fileManager }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="deleteDialog = true"> <Trash2Icon /> Delete </DropdownMenuItem>

        <DropdownMenuItem v-if="hasApi" @click="fillFromApiDialog = true">
          <CloudDownloadIcon /> Fill from API
        </DropdownMenuItem>

        <DropdownMenuItem
          @click="
            fileEditor.viewSettingsUpdaterPartial({
              labelsHidden: !fileEditor.viewSettingsQ.data.value?.labelsHidden,
            })
          "
        >
          <EyeIcon />
          {{ fileEditor.viewSettingsQ.data.value?.labelsHidden ? 'Show' : 'Hide' }} Labels
        </DropdownMenuItem>

        <DropdownMenuItem
          v-if="fileEditor.viewSettingsQ.data.value?.layoutWarningsHidden"
          @click="
            fileEditor.viewSettingsUpdaterPartial({
              layoutWarningsHidden: !fileEditor.viewSettingsQ.data.value?.layoutWarningsHidden,
            })
          "
        >
          <EyeIcon />
          {{ fileEditor.viewSettingsQ.data.value?.layoutWarningsHidden ? 'Show' : 'Hide' }}
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
    @handle-add-from-api="handleFillFromApiMutation.mutate"
  />

  <Dialog v-model:open="renameDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rename File</DialogTitle>
      </DialogHeader>

      <div class="flex gap-2 items-center font-mono"><Input v-model="newName" autofocus /> .md</div>

      <DialogFooter class="flex gap-2">
        <DialogClose as-child>
          <Button variant="outline" class="grow">Cancel</Button>
        </DialogClose>
        <Button class="grow" @click="props.fileEditor.onRename(newName)">Rename</Button>
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
</template>

<script setup lang="ts">
import { useTabsStoreV2, type IOpened } from '~/composables/stores/useTabsStoreV2';
import AddAndSearch from '../Add/AddAndSearch.vue';
import BreadCrumbsList from './BreadCrumbsList.vue';
import { path } from '@tauri-apps/api';
import { c_delete_to_trash } from '~/api/tauriActions';
import { makeFileAttrsFromApi, type APIEmitData } from '~/components/Api/makeFileFromApi';
import type { ApiSettings } from '~/components/Api/apis';
import { useRootPathInjectSafe } from '~/composables/data/providers';
import { provideApiSaveInProgress } from '~/components/Api/base';
import { handleOurErrorWithNotification } from '~/components/Core/Errors/errors';
import {
  CloudDownloadIcon,
  EditIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  FolderIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-vue-next';

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
  fileEditor: {
    type: Object as PropType<ReturnType<typeof useFileEditorV2>>,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'openEditMode'): void;
}>();

const ts = useTabsStoreV2();

const deleteDialog = ref(false);
const fillFromApiDialog = ref(false);
const renameDialog = ref(false);
const newName = ref('');

const startRename = async () => {
  renameDialog.value = true;
  newName.value = await path.basename(props.opened._path, await path.extname(props.opened._path));
};

const onRemove = async () => {
  await c_delete_to_trash(props.opened._path);
  ts.openNewThingFast({ _type: 'folder', _path: await path.dirname(props.opened._path) });
};

const schema = computed(() => props.fileEditor.fileQ.data.value?.record.schema);

const fileManager = useFileManagerName();

const apiConnection = useApiConnection(
  computed(() => schema.value?.location.schema_owner_folder ?? ''),
);

const hasApi = computed(() => {
  return apiConnection.q.data?.value && apiConnection.q.data.value.type !== 'none';
});

const rootPath = useRootPathInjectSafe();

const saveInProgress = ref<string>('');
provideApiSaveInProgress(saveInProgress);

const handleFillFromApiMutation = useMutation({
  mutation: async (data: APIEmitData<ApiSettings>) => {
    if (!props.fileEditor.editableProxy.value) {
      throw new Error('Fill from API: No editable proxy');
    }
    const attrs = await makeFileAttrsFromApi({
      data,
      rootPath: rootPath.value,
    });

    props.fileEditor.editableProxy.value.record.record.attrs = {
      ...props.fileEditor.editableProxy.value.record.record.attrs,
      ...attrs,
    };
  },
  onMutate: (data) => {
    if (!data.apiData.id) return;
    saveInProgress.value = data.apiData.id;
  },
  onSettled() {
    saveInProgress.value = '';
  },
  onSuccess() {
    fillFromApiDialog.value = false;
  },

  onError(e) {
    console.error(e);
    handleOurErrorWithNotification({
      title: 'Error filling from API',
      rawError: e.message,
      isError: true,
      subErrors: [],
    });
  },
});
</script>
