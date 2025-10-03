<template>
  <div class="grid grid-cols-1 gap-4">
    <div v-for="extra in extras">
      <h5 class="text-sm opacity-20">{{ extra.label }}</h5>

      <div>
        <AttributesRouter v-model="extra.value" :schema-item="extra.schema" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AttrValue, SchemaItem } from '~/types';
import AttributesRouter from '../Views/Editor/AttributesRouter.vue';

onBeforeMount(() => {});

const extras = ref<{ value: AttrValue; label: string; schema: SchemaItem }[]>([
  {
    value: {
      type: 'DatePairVec',
      value: [
        { started: '2025-09-01', finished: '2025-09-02' },
        { started: '2025-01-01', finished: '2025-01-02' },
      ],
    },
    label: 'basic',
    schema: {
      name: 'test',
      value: {
        type: 'DatesPairCollection',
        settings: {
          settingsType: 'DatesPairCollection',
        },
      },
    },
  },
  {
    value: { type: 'DatePairVec', value: [] },
    label: 'empty ',
    schema: {
      name: 'test',
      value: {
        type: 'DatesPairCollection',
        settings: {
          settingsType: 'DatesPairCollection',
        },
      },
    },
  },
]);
</script>
