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
import AttributesRouter from '../Editor/AttributesRouter.vue';

onBeforeMount(() => {});

const extras = ref<{ value: AttrValue; label: string; schema: SchemaItem }[]>([
  {
    value: { type: 'StringVec', value: ['lol', 'kek'] },
    label: 'basic',
    schema: {
      name: 'test',
      value: { type: 'TextCollection', settings: { settingsType: 'TextCollection' } },
    },
  },
  {
    value: { type: 'StringVec', value: [] },
    label: 'empty ',
    schema: {
      name: 'test',
      value: { type: 'TextCollection', settings: { settingsType: 'TextCollection' } },
    },
  },
  {
    value: { type: 'StringVec', value: ['fun', 'nice', 'great'] },
    label: 'With prefix',
    schema: {
      name: 'test',
      value: { type: 'TextCollection', settings: { settingsType: 'TextCollection', prefix: '#' } },
    },
  },
]);
</script>
