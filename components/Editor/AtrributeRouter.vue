<template>
  <template v-if="attr">
    <UIBasicInput
      v-if="schemaItem.value.type === 'Text' && attr.type === 'String'"
      v-model:model-value="attr.value"
      :placeholder="schemaItem.value.settings.displayName || schemaItem.name"
      :theme="schemaItem.value.settings.theme"
      :multi-line="schemaItem.value.settings.isMultiline"
      :size="schemaItem.value.settings.size"
      :font="schemaItem.value.settings.font"
      :weight="schemaItem.value.settings.weight"
    />

    <UIBasicInput
      v-else-if="
        schemaItem.value.type === 'Number' && (attr.type === 'Float' || attr.type === 'Integer')
      "
      :placeholder="schemaItem.value.settings.displayName || schemaItem.name"
      is-number
      v-model:number="attr.value"
    />

    <EditorTagsEditor
      v-else-if="schemaItem.value.type === 'TextCollection' && attr.type === 'StringVec'"
      v-model:model-value="attr.value"
    />

    <EditorReadDetails
      v-else-if="schemaItem.value.type === 'DatesPairCollection' && attr.type === 'DatePairVec'"
      v-model:model-value="attr.value"
    />
    <EditorImageInput
      v-else-if="schemaItem.value.type === 'Image' && attr.type === 'String'"
      v-model="attr.value"
    />
    <div v-else class="flex flex-col gap-1 border border-red-500 rounded-md py-1 px-2 text-sm">
      Unsupported attribute type or type mismatch:
      <div class="flex flex-col gap-2 font-mono text-xs">
        Schema: {{ schemaItem.value.type }} Attribute: {{ attr.type }}
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import type { AttrValue, SchemaItem } from '~/types';

const attr = defineModel<AttrValue>();

const props = defineProps<{
  schemaItem: SchemaItem;
}>();
</script>
