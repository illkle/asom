<template>
  <div class="h-full overflow-scroll scrollbarMod">
    <SchemaFieldsEditor
      v-if="selectedItemSchema"
      :path="selectedItemSchema"
      :key="selectedItemSchema"
      @back="selectedItemSchema = null"
    />
    <LayoutEditor
      v-if="selectedItemLayout"
      :path="selectedItemLayout"
      @back="selectedItemLayout = null"
    />
    <ApiConnection
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
import ApiConnection from '../SchemaEditor/ApiConnection.vue';
import LayoutEditor from '../SchemaEditor/LayoutEditor.vue';
import SchemaFieldsEditor from '../SchemaEditor/SchemaFieldsEditor.vue';

const store = useMainStore();

const selectedItemSchema = ref<string | null>(null);
const selectedItemLayout = ref<string | null>(null);
const selectedItemApiConnection = ref<string | null>(null);
</script>
