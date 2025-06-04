<template>
  <div class="h-full overflow-scroll scrollbarMod">
    <SchemaEditorSchemaFieldsEditor
      v-if="selectedItem"
      :path="selectedItem"
      :key="selectedItem"
      @back="selectedItem = null"
    />
    <SchemaEditor
      v-else
      @edit-schema="(v) => (selectedItem = v)"
      @exit-schema-editor="store.setView('app')"
    />
  </div>
</template>

<script setup lang="ts">
import SchemaEditor from '~/components/SchemaEditor/SchemaEditor.vue';
import { useMainStore } from '~/composables/stores/useMainStore';

const store = useMainStore();

const selectedItem = ref<string | null>(null);
</script>
