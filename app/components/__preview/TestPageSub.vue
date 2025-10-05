<template>
  <div>
    {{ fl.files.data.value }}
  </div>
</template>

<script setup lang="ts">
import { useFilesListV2 } from '~/components/Views/List/useFileList';

const props = defineProps({
  path: {
    type: String,
    required: true,
  },
});

const fl = useFilesListV2({
  opened: {
    _type: 'folder',
    _path: props.path,
    scrollPositionY: 0,
    scrollPositionX: 0,
    details: {},
  },
});
</script>
