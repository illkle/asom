<template>
  <div v-if="attr" class="w-full">
    <TextInput
      v-if="schemaItem.value.type === 'Text' && attr.type === 'String'"
      v-model="attr.value"
      :settings="schemaItem.value.settings"
      :name="name"
      :hide-label="hideLabel"
      :disabled="disabled"
    />

    <!-- prettier-ignore-attribute  v-model -->
    <NumberInput
      v-else-if="
        schemaItem.value.type === 'Number' && (attr.type === 'Float' || attr.type === 'Integer')
      "
      v-model="(attr.value as number | null)"
      :settings="schemaItem.value.settings"
      :name="name"
      :hide-label="hideLabel"
      :disabled="disabled"
    />

    <TagsInput
      v-else-if="schemaItem.value.type === 'TextCollection' && attr.type === 'StringVec'"
      :settings="schemaItem.value.settings"
      v-model:model-value="attr.value"
      :name="name"
      :disabled="disabled"
      :hide-label="hideLabel"
    />

    <DateInput
      v-else-if="schemaItem.value.type === 'Date' && attr.type === 'String'"
      v-model:model-value="attr.value"
      :name="name"
      :disabled="disabled"
      :hide-label="hideLabel"
    />

    <DateCollection
      v-else-if="schemaItem.value.type === 'DateCollection' && attr.type === 'StringVec'"
      v-model:model-value="attr.value"
      :name="name"
      :disabled="disabled"
      :hide-label="hideLabel"
    />

    <DateRangeInput
      v-else-if="schemaItem.value.type === 'DatesPairCollection' && attr.type === 'DatePairVec'"
      v-model:model-value="attr.value"
      :name="name"
      :disabled="disabled"
      :hide-label="hideLabel"
    />
    <ImageInput
      v-else-if="schemaItem.value.type === 'Image' && attr.type === 'String'"
      v-model="attr.value"
      :name="name"
      :disabled="disabled"
      :hide-label="hideLabel"
    />
    <div v-else class="flex flex-col gap-1 border border-red-500 rounded-md py-1 px-2 text-sm">
      Unsupported attribute type or type mismatch:
      <div class="flex flex-col gap-2 font-mono text-xs">
        Schema: {{ schemaItem.value.type }} Attribute: {{ attr.type }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AttrValue, SchemaItem } from '~/types';
import DateInput from './Inputs/Date.vue';
import DateCollection from './Inputs/DateCollection.vue';
import DateRangeInput from './Inputs/DatesPairCollection.vue';
import ImageInput from './Inputs/Image.vue';
import NumberInput from './Inputs/Number.vue';
import TextInput from './Inputs/Text.vue';
import TagsInput from './Inputs/TextCollection.vue';
const attr = defineModel<AttrValue>();

const props = defineProps<{
  schemaItem: SchemaItem;
  disabled?: boolean;
  hideLabel?: boolean;
}>();

const name = computed(() => {
  return props.schemaItem.value.settings.displayName ?? props.schemaItem.name;
});
</script>
