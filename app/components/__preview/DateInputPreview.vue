<template>
  <div class="grid grid-cols-3 gap-4">
    <div v-for="extra in extras">
      <h5 class="text-sm opacity-20">{{ extra.label }}</h5>

      <AttributesRouter v-model="extra.value" :schema-item="extra.schema" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AttrValue, SchemaItem } from '~/types';
import AttributesRouter from '../Views/Editor/AttributesRouter.vue';

onBeforeMount(() => {});

const extras = ref<{ value: AttrValue; label: string; schema: SchemaItem }[]>([
  {
    value: { type: 'String', value: '2025-09-01' },
    label: 'basic',
    schema: {
      name: 'test',
      value: {
        type: 'Date',
        settings: {
          settingsType: 'Date',
        },
      },
    },
  },
  {
    value: { type: 'String', value: '2025-05-01' },
    label: 'basic',
    schema: {
      name: 'test',
      value: {
        type: 'Date',
        settings: {
          settingsType: 'Date',
        },
      },
    },
  },
  {
    value: { type: 'String', value: null },
    label: 'empty ',
    schema: {
      name: 'test',
      value: {
        type: 'Date',
        settings: {
          settingsType: 'Date',
        },
      },
    },
  },
]);
</script>
