<template>
  <div v-if="data" class="flex gap-4">
    <div>
      <div>Your email</div>
      <Input v-model="data.yourEmail" />

      <span class="text-xs text-gray-500">
        This email is sent directly to Open Library API. They will contact you if you use it too
        much(unlikely to ever happen).
      </span>
    </div>
  </div>

  <h4 class="text-lg font-serif mt-4 mb-2">Mapping</h4>

  <MappingSelector
    v-if="data"
    v-model:mapping="data.mapping"
    :schema="schema"
    :api-schema="openLibraryAPISchema"
  />
</template>

<script setup lang="ts">
import MappingSelector from '~/components/Api/MappingSelector.vue';
import { openLibraryAPISchema } from '~/components/Api/OpenLibrary';
import type { Schema } from '~/types';
import type { ApiSettingsOpenLibrary } from '.';

const props = defineProps<{
  schema: Schema;
}>();

const data = defineModel<ApiSettingsOpenLibrary>();
</script>
