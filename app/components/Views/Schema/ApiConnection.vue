<template>
  <div class="mx-auto max-w-4xl w-full px-5">
    <div class="flex items-center justify-between pt-10">
      <h1 class="mb-4 font-serif text-3xl">Api Connection</h1>

      <Button variant="outline" @click="emit('back')">Save</Button>
    </div>

    <div>Select api to connect to this schema:</div>

    <Select
      v-if="apiData"
      :model-value="apiData.type"
      @update:model-value="(v) => (apiData.type = v as ApiSettings['type'])"
    >
      <SelectTrigger class="mt-4">
        <SelectValue placeholder="Select an API" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="type in API_Types" :key="type" :value="type">
          {{ type }}
        </SelectItem>
      </SelectContent>
    </Select>

    <div v-if="schema.data.value && apiData" class="mt-4">
      <IGDB
        v-if="apiData.type === 'twitchigdb'"
        v-model="apiData"
        :schema="schema.data.value.schema"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import IGDB from '~/components/Api/IGDB/Settings.vue';
import type { ApiSettings } from '~/components/Api/apis';
import { API_Types } from '~/components/Api/apis';

const emit = defineEmits<{
  (e: 'back'): void;
}>();
const props = defineProps<{
  path: string;
}>();

const schema = useSchemaByPath(computed(() => props.path));

const { editableData: apiData, q } = useApiConnection(computed(() => props.path));
</script>
