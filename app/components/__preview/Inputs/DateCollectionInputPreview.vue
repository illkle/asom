<template>
  <div class="grid grid-cols-3 gap-4">
    <div v-for="extra in extras">
      <h5 class="text-sm opacity-20">{{ extra.label }}</h5>

      <AttributesRouter v-model="extra.value" :schema-item="extra.schema" />
    </div>
  </div>
</template>

<script setup lang="ts">
import AttributesRouter from '~/components/Views/Editor/AttributesRouter.vue';
import type { AttrValue, SchemaItem } from '~/types';

onBeforeMount(() => {});

const extras = ref<{ value: AttrValue; label: string; schema: SchemaItem }[]>([
  {
    value: { type: 'StringVec', value: ['2025-01-01', '2025-01-02', '2025-09-02'] },
    label: 'basic',
    schema: {
      name: 'test',
      value: {
        type: 'DateCollection',
        settings: {
          settingsType: 'DateCollection',
        },
      },
    },
  },
  {
    value: { type: 'StringVec', value: [] },
    label: 'empty ',
    schema: {
      name: 'test',
      value: {
        type: 'DateCollection',
        settings: {
          settingsType: 'DateCollection',
        },
      },
    },
  },
]);
</script>
