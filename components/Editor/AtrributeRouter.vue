<template>
  <UIBasicInput
    v-if="schemaItem.value.type === 'Text' && attr?.type === 'String'"
    :model-value="attr.value"
    :placeholder="schemaItem.value.settings.displayName || schemaItem.name"
    :theme="schemaItem.value.settings.theme"
    :multi-line="schemaItem.value.settings.isMultiline"
    :size="schemaItem.value.settings.size"
    :font="schemaItem.value.settings.font"
    :weight="schemaItem.value.settings.weight"
  />

  <UIBasicInput
    v-else-if="
      schemaItem.value.type === 'Number' && (attr?.type === 'Float' || attr?.type === 'Integer')
    "
    :placeholder="schemaItem.value.settings.displayName || schemaItem.name"
    is-number
    v-model:number="attr.value"
  />

  <EditorTagsEditor
    v-else-if="schemaItem.value.type === 'TextCollection' && attr?.type === 'StringVec'"
    v-model:model-value="attr.value"
  />

  <EditorReadDetails
    v-else-if="schemaItem.value.type === 'DatesPairCollection' && attr?.type === 'DateReadVec'"
    v-model:model-value="attr.value"
  />
</template>

<script setup lang="ts">
import type { AttrValue, DateRead, SchemaItem } from '~/types';

const attr = defineModel<AttrValue>();

const props = defineProps<{
  schemaItem: SchemaItem;
}>();
</script>
