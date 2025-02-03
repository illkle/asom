<template>
  <UIBasicInput
    v-if="schemaItem.value.type === 'Text' && attr?.type === 'String'"
    :model-value="attr?.value"
    :placeholder="schemaItem.value.settings.displayName || schemaItem.name"
    :theme="schemaItem.value.settings.theme"
    :multi-line="schemaItem.value.settings.isMultiline"
    :size="schemaItem.value.settings.size"
    :font="schemaItem.value.settings.font"
    :weight="schemaItem.value.settings.weight"
  />
</template>

<script setup lang="ts">
import type { AttrValue, DateRead, SchemaItem } from '~/types';

const attr = defineModel<AttrValue>();

const props = defineProps<{
  schemaItem: SchemaItem;
}>();
</script>
