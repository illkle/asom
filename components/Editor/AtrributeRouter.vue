<template>
  <UIBasicInput
    v-if="schemaItem.value.type === 'Text'"
    :model-value="(attr as string)"
    :placeholder="schemaItem.value.settings.displayName || schemaItem.name"
    :theme="schemaItem.value.settings.theme"
    :multi-line="schemaItem.value.settings.isMultiline"
    :size="schemaItem.value.settings.size"
    :font="schemaItem.value.settings.font"
    :weight="schemaItem.value.settings.weight"
  />

  <UIBasicInput
    v-else-if="schemaItem.value.type === 'Number'"
    :placeholder="schemaItem.value.settings.displayName || schemaItem.name"
    is-number
    v-model:number="attr as number"
  />

  <EditorTagsEditor
    v-else-if="schemaItem.value.type === 'TextCollection'"
    v-model:model-value="attr as string[]"
  />

  <EditorReadDetails
    v-else-if="schemaItem.value.type === 'DatesPairCollection'"
    v-model:model-value="attr as DateRead[]"
  />
</template>

<script setup lang="ts">
import type { AttrValue, DateRead, SchemaItem } from '~/types';

const attr = defineModel<AttrValue>();

const props = defineProps<{
  schemaItem: SchemaItem;
}>();
</script>
