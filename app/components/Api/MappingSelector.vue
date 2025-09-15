<template>
  <div
    v-for="(type, name) in apiSchema"
    :key="name"
    class="grid grid-cols-3 gap-2 w-full odd:bg-accent/20 p-2 items-center"
  >
    <div>
      <div>{{ name }}</div>
      <div class="text-xs text-muted-foreground">{{ type }}</div>
    </div>

    <Select
      :model-value="mapping[name as string]?.schemaName ?? null"
      @update:model-value="
        (v) => {
          if (!v) {
            delete mapping[name as string];
            return;
          }

          if (mapping[name as string]) {
            mapping[name as string]!.schemaName = v as string;
          } else {
            mapping[name as string] = {
              schemaName: v as string,
              converterFlags: {},
            };
          }
        }
      "
      :options="availableFields[apiSchema[name]]"
      class="w-full"
    >
      <SelectTrigger class="w-full">
        {{ mapping[name as string]?.schemaName || 'None' }}
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="field in availableFields[apiSchema[name]]" :key="field" :value="field">
          {{ field }}
        </SelectItem>
        <SelectItem :value="null" class="opacity-50"> None </SelectItem>
      </SelectContent>
    </Select>

    <div v-if="mapping[name as string]?.schemaName">
      <template
        v-if="apiSchema[name] === 'Text' && getTypeForSchemaItemByName(name) === 'TextCollection'"
      >
        Is text and {{ getTypeForSchemaItemByName(name) }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts" generic="ApiSchema extends Record<string, SchemaAttrType['type']>">
import type { Schema, SchemaAttrType, SchemaItem } from '~/types';
import type { ApiToSchemaMapping, ConverterFlags } from '../Api/base';

const props = defineProps<{
  schema: Schema | null;
  apiSchema: ApiSchema;
}>();

const schemaItemsByName = computed(() => {
  if (!props.schema) return {} as Record<string, SchemaItem>;
  return Object.fromEntries(props.schema.items.map((item) => [item.name, item]));
});

const mapping = defineModel<ApiToSchemaMapping>('mapping', {
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
      mapping.value = {} as Record<
        keyof ApiSchema,
        { schemaName: string; converterFlags: ConverterFlags }
      >;
      return;
    }

    const availableFields = makeAvailableFields(schema);

    for (const [key, value] of Object.entries(apiSchema)) {
      const opts = availableFields[value];
      const currentValue = mapping.value[key];

      if (!currentValue || opts.includes(currentValue.schemaName)) {
        continue;
      }

      delete mapping.value[key];
    }
  },
  { immediate: true },
);

const getTypeForSchemaItemByName = (name: keyof ApiSchema) => {
  return (
    schemaItemsByName.value[mapping.value[name as string]?.schemaName ?? '']?.value.type ?? null
  );
};
</script>
