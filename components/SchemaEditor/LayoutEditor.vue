<template>
  <div class="mx-auto max-w-4xl w-full px-5">
    <div class="flex items-center justify-between pt-10">
      <h1 class="mb-4 font-serif text-3xl">Layout editor</h1>
    </div>

    <div class="flex flex-col gap-2 text-sm text-muted-foreground">
      It's easier to edit layout on an existing file, because some properties(notably "Size Units")
      are not reflected in layout editor
    </div>

    <div v-if="editableProxy && schema.data.value && viewLayoutQ.data.value">
      <EditorMetaEditor
        v-model:opened-file="editableProxy"
        :view-layout="viewLayoutQ.data.value"
        :hide-labels="viewSettingsQ.data.value?.labelsHidden"
        @update:layout="
          (v) => {
            updateViewLayout(v);
            emit('back');
          }
        "
        @discard="
          () => {
            emit('back');
          }
        "
        :edit-mode="true"
        :schema="schema.data.value.schema"
        class="py-2"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AttrValue, RecordFromDb } from '~/types';
import { getValByType } from './mocks';

const editableProxy = ref<RecordFromDb>({
  path: null,
  modified: null,
  markdown: 'null',
  attrs: {},
});

const emit = defineEmits<{
  (e: 'back'): void;
}>();
const props = defineProps<{
  path: string;
}>();

const schema = useSchemaByPath(computed(() => props.path));

const ownerFolder = computed(() => schema.data.value?.owner_folder ?? '');

const { q: viewLayoutQ, update: updateViewLayout } = useViewLayout(ownerFolder);

const { q: viewSettingsQ } = useViewSettings(ownerFolder);

const editMode = ref(false);

watch(
  computed(() => schema.data.value),
  (v) => {
    console.log('v', v);
    if (v) {
      const att: Record<string, AttrValue> = {};

      v.schema.items.forEach((item) => {
        att[item.name] = getValByType(item.value.type);
      });

      editableProxy.value.attrs = att;
    }
  },
  { deep: true, immediate: true },
);
</script>
