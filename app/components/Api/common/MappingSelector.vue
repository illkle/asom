<template>
  <div class="grid grid-cols-3 gap-y-2 gap-x-4 w-full odd:bg-accent/20 p-2 items-center">
    <div class="text-xs text-muted-foreground">API</div>
    <div class="text-xs text-muted-foreground">Schema</div>
    <div class="text-xs text-muted-foreground">Conversion mode</div>

    <template v-for="(apiFieldType, apiFieldName) in apiSchema" :key="apiFieldName" class="">
      <div>
        <div>{{ apiFieldName }}</div>
        <div class="text-xs text-muted-foreground">{{ apiFieldType }}</div>
      </div>

      <Select
        :model-value="mapping[apiFieldName as string]?.schemaName ?? null"
        @update:model-value="
          (v) => {
            if (!v) {
              emit('deleteByKey', apiFieldName as string);
            }

            emit('setByKey', apiFieldName as string, {
              schemaName: v as string,
            });
          }
        "
        :options="availableSchemaItemsByApiFieldName[apiFieldName]"
        class="w-full"
      >
        <SelectTrigger class="w-full flex gap-2">
          <span class="flex gap-2 items-baseline">
            {{ getAssignedSchemaItemByApiName(apiFieldName) ?? 'None' }}
            <span
              v-if="mapping[apiFieldName as string]?.schemaName"
              class="text-xs text-muted-foreground"
            >
              {{ getTypeForSchemaItemByApiName(apiFieldName) }}
            </span>
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="field in availableSchemaItemsByApiFieldName[apiFieldName]"
            :key="field"
            :value="field"
          >
            <span
              class="flex gap-2 items-baseline"
              :class="{
                'opacity-50': apiFieldType !== getTypeForSchemaItemBySchemaItemName(field),
              }"
            >
              {{ field }}
              <span class="text-xs text-muted-foreground">
                {{ getTypeForSchemaItemBySchemaItemName(field) }}
              </span>
            </span>
          </SelectItem>
          <SelectItem :value="null" class="opacity-50"> None </SelectItem>
        </SelectContent>
      </Select>

      <div v-if="getAssignedSchemaItemByApiName(apiFieldName)">
        <template
          v-for="value in [
            getCoversionModes(
              apiSchema[apiFieldName] ?? null,
              getTypeForSchemaItemByApiName(apiFieldName),
            ),
          ]"
        >
          <template v-if="Array.isArray(value)">
            <!-- Conversion mode select -->
            <Select
              :model-value="mapping[apiFieldName as string]?.mode ?? null"
              @update:model-value="
                (v) => {
                  emit('updateModeByKey', apiFieldName as string, v as string);
                }
              "
              :options="value"
            >
              <SelectTrigger class="w-full">
                {{ mapping[apiFieldName as string]?.mode || 'Default' }}
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="item in value" :key="item" :value="item">
                  {{ item }}
                </SelectItem>
              </SelectContent>
            </Select>
          </template>
        </template>
      </div>
      <div v-else></div>
    </template>
  </div>
</template>

<script setup lang="ts" generic="ApiSchema extends Record<string, SchemaAttrType['type']>">
import {
  getAllowedTargets,
  getCoversionModes,
  type ApiToSchemaMapping,
  type ApiToSchemaMappingItem,
} from '~/components/Api/base';
import type { Schema, SchemaAttrType, SchemaItem } from '~/types';

const props = defineProps<{
  schema: Schema | null;
  apiSchema: ApiSchema;
  mapping: ApiToSchemaMapping;
}>();

const emit = defineEmits<{
  (e: 'setByKey', key: string, mapping: ApiToSchemaMappingItem): void;
  (e: 'deleteByKey', key: string): void;
  (e: 'updateModeByKey', key: string, mode: string): void;
}>();

const schemaItemsByName = computed(() => {
  if (!props.schema) return {} as Record<string, SchemaItem>;
  return Object.fromEntries(props.schema.items.map((item) => [item.name, item]));
});

const schemaFieldsByType = computed(() => {
  if (!props.schema) return {} as Record<SchemaAttrType['type'], string[]>;
  const rrr: Record<SchemaAttrType['type'], string[]> = {
    Text: [],
    TextCollection: [],
    Number: [],
    Date: [],
    DateCollection: [],
    DatesPairCollection: [],
    Image: [],
  };

  for (const item of props.schema.items) {
    rrr[item.value.type].push(item.name);
  }
  return rrr;
});

const availableSchemaItemsByApiFieldName = computed(() => {
  const rrr: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(props.apiSchema)) {
    const allowed = getAllowedTargets(value);

    for (const allowedTarget of allowed) {
      if (rrr[key]) {
        rrr[key].push(...schemaFieldsByType.value[allowedTarget]);
      } else {
        rrr[key] = [...schemaFieldsByType.value[allowedTarget]];
      }
    }
  }
  return rrr as Record<keyof ApiSchema, string[]>;
});

const getTypeForSchemaItemBySchemaItemName = (name: string) => {
  return schemaItemsByName.value[name]?.value.type ?? null;
};

const getAssignedSchemaItemByApiName = (name: keyof ApiSchema) => {
  return props.mapping[name as string]?.schemaName ?? null;
};

const getTypeForSchemaItemByApiName = (name: keyof ApiSchema) => {
  const schemaItemName = getAssignedSchemaItemByApiName(name);

  if (!schemaItemName) return null;

  return schemaItemsByName.value[schemaItemName]?.value.type ?? null;
};
</script>
