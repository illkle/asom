<template>
  <FileTreeInner v-for="folder in transformedFolders" :content="folder" />
</template>

<script lang="ts" setup>
import FileTreeInner from './FileTreeInner.vue';

const props = defineProps<{
  schemaPath: string;
  schemaName: string;
}>();

const handler = useFolderInvalidator();

const { transformedFolders, query } = useFoldersBySchema(props.schemaPath);
</script>
