<template>
  <div class="h-full overflow-scroll scrollbarMod">
    <SchemaEditorSchemaFieldsEditor
      v-if="selectedItemSchema"
      :path="selectedItemSchema"
      :key="selectedItemSchema"
      @back="selectedItemSchema = null"
    />
    <SchemaEditorLayoutEditor
      v-if="selectedItemLayout"
      :path="selectedItemLayout"
      @back="selectedItemLayout = null"
    />
    <SchemaEditorApiConnection
      v-else-if="selectedItemApiConnection"
      :path="selectedItemApiConnection"
      @back="selectedItemApiConnection = null"
    />
    <SchemaEditor
      v-else
      @edit-schema="(v) => (selectedItemSchema = v)"
      @edit-layout="(v) => (selectedItemLayout = v)"
      @edit-api-connection="(v) => (selectedItemApiConnection = v)"
      @exit-schema-editor="store.setView('app')"
    />
  </div>
</template>

<script setup lang="ts">
import SchemaEditor from '~/components/SchemaEditor/SchemaEditor.vue';
import { useMainStore } from '~/composables/stores/useMainStore';

const store = useMainStore();

const selectedItemSchema = ref<string | null>(null);
const selectedItemLayout = ref<string | null>(null);
const selectedItemApiConnection = ref<string | null>(null);
</script>
