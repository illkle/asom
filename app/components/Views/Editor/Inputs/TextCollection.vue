<template>
  <TagsInput v-model="tags" :disabled="disabled">
    <TagsInputItem v-for="item in modelValue" :disabled="disabled" :key="item" :value="item">
      <TagsInputItemText />
      <TagsInputItemDelete :disabled="disabled" />
    </TagsInputItem>
    <TagsInputInput :placeholder="'Add ' + (settings?.displayName ?? name) + '...'" />
  </TagsInput>
</template>

<script lang="ts" setup>
import type { TextCollectionSettings } from 'types';
const tags = defineModel<string[] | null>();

const props = defineProps<{
  settings: TextCollectionSettings | null;
  name: string;
  disabled?: boolean;
  hideLabel?: boolean;
}>();
</script>
