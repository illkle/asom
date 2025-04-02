<template>
  <template v-if="attr">
    <TextInput
      v-if="schemaItem.value.type === 'Text' && attr.type === 'String'"
      v-model="attr.value"
      :settings="schemaItem.value.settings"
      :name="schemaItem.name"
    />

    <NumberInput
      v-else-if="
        schemaItem.value.type === 'Number' && (attr.type === 'Float' || attr.type === 'Integer')
      "
      v-model="attr.value"
      :settings="schemaItem.value.settings"
      :name="schemaItem.name"
    />

    <TagsInput
      v-else-if="schemaItem.value.type === 'TextCollection' && attr.type === 'StringVec'"
      v-model:model-value="attr.value"
    />

    <DateRangeInput
      v-else-if="schemaItem.value.type === 'DatesPairCollection' && attr.type === 'DatePairVec'"
      v-model:model-value="attr.value"
    />
    <ImageInput
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
import DateRangeInput from './Inputs/DateRangeInput.vue';
import ImageInput from './Inputs/ImageInput.vue';
import NumberInput from './Inputs/NumberInput.vue';
import TagsInput from './Inputs/TagsInput.vue';
import TextInput from './Inputs/TextInput.vue';

const attr = defineModel<AttrValue>();

const props = defineProps<{
  schemaItem: SchemaItem;
}>();
</script>
