<template>
  <div class="mx-auto max-w-4xl w-full px-5">
    <div class="flex items-center justify-between pt-10">
      <h1 class="mb-4 font-serif text-3xl">Api Connection</h1>

      <Button variant="outline" @click="emit('back')">Save</Button>
    </div>

    <div>Select api to connect to this schema:</div>

    <Select
      v-if="apiConnection.q.data.value"
      :model-value="apiConnection.q.data.value?.type"
      @update:model-value="(v) => apiConnection.update({ type: v as ApiConnection['type'] })"
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

    <div v-if="schema.data.value" class="mt-4">
      <IGDB
        v-if="apiConnection.q.data.value?.type === 'twitchigdb'"
        :data="apiConnection.q.data.value"
        :schema="schema.data.value.schema"
        @update="apiConnection.update"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import IGDB from '~/components/SchemaEditor/ApiSettings/IGDB.vue';
import { API_Types, type ApiConnection } from '~/composables/useApiConnections';

const emit = defineEmits<{
  (e: 'back'): void;
}>();
const props = defineProps<{
  path: string;
}>();

const schema = useSchemaByPath(computed(() => props.path));

const apiConnection = useApiConnection(computed(() => props.path));
</script>
