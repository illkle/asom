<template>
  <div v-if="showLayoutWarning" class="text-xs text-muted-foreground p-1 flex">
    You have {{ invisibleSchemaItems.length }} item{{
      invisibleSchemaItems.length === 1 ? '' : 's'
    }}
    in schema that are not visible in the view:
    <br />
    <span class="cursor-pointer underline ml-4" @click="emit('openEditMode')">Edit Layout</span>
    <span
      class="cursor-pointer underline ml-4"
      @click="fileEditor.viewSettingsUpdaterPartial({ layoutWarningsHidden: true })"
      >Hide
    </span>
  </div>
</template>

<script setup lang="ts">
import type { IDynamicItem } from '~/components/Modules/DynamicView/helpers';
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';

const props = defineProps<{
  fileEditor: ReturnType<typeof useFileEditorV2>;
}>();

const emit = defineEmits<{
  (e: 'openEditMode'): void;
}>();

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
  if (!props.fileEditor.viewLayoutQ.data.value) return {};
  markKey(props.fileEditor.viewLayoutQ.data.value, hasKey);
  return hasKey;
});

const schema = computed(() => props.fileEditor.fileQ.data.value?.record.schema);

const invisibleSchemaItems = computed(() => {
  if (!schema.value) return [];
  return (
    schema.value?.schema.items
      .filter((item) => !viewLayoutKeys.value[item.name])
      .map((item) => item.name) ?? []
  );
});
const showLayoutWarning = computed(() => {
  return (
    !props.fileEditor.viewSettingsQ.data.value?.layoutWarningsHidden &&
    invisibleSchemaItems.value.length
  );
});
</script>
