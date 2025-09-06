<template>
  <div
    v-for="(type, name) in apiSchema"
    :key="name"
    class="grid grid-cols-2 w-full odd:bg-accent/20 p-2 items-center"
  >
    <div>
      <div>{{ name }}</div>
      <div class="text-xs text-muted-foreground">{{ type }}</div>
    </div>

    <Select v-model="mapping[name]" :options="availableFields[apiSchema[name]]" class="w-full">
      <SelectTrigger class="w-full">{{ mapping[name as string] || 'None' }}</SelectTrigger>
      <SelectContent>
        <SelectItem v-for="field in availableFields[apiSchema[name]]" :key="field" :value="field">
          {{ field }}
        </SelectItem>
        <SelectItem :value="null" class="opacity-50"> None </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, SchemaAttrType['type']>">
import type { Schema, SchemaAttrType } from '~/types';

const props = defineProps<{
  schema: Schema | null;
  apiSchema: T;
}>();

const mapping = defineModel<Record<string, string | null>>('mapping', {
  required: true,
});

type AvailableFields = Record<SchemaAttrType['type'], string[]>;

const makeAvailableFields = (schema: Schema) => {
  const rrr: AvailableFields = {
    Text: [],
    TextCollection: [],
    Number: [],
    Date: [],
    DateCollection: [],
    DatesPairCollection: [],
    Image: [],
  };

  for (const item of schema.items) {
    rrr[item.value.type].push(item.name);
  }
  return rrr;
};

const availableFields = computed(() => {
  if (!props.schema) return {} as Record<SchemaAttrType['type'], string[]>;
  return makeAvailableFields(props.schema);
});

watch(
  [() => props.schema, () => props.apiSchema],
  ([schema, apiSchema]) => {
    if (!schema) {
      mapping.value = {} as Record<keyof T, string>;
      return;
    }

    const availableFields = makeAvailableFields(schema);

    for (const [key, value] of Object.entries(apiSchema)) {
      const opts = availableFields[value];
      const currentValue = mapping.value[key];

      if (!currentValue || opts.includes(currentValue)) {
        continue;
      }

      delete mapping.value[key];
    }
  },
  { immediate: true },
);
</script>
