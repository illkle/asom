<template>
  <div class="flex flex-col gap-2 mx-auto px-4 w-full py-10 max-w-5xl">
    <h1>Area for testing components.</h1>
    <div class="text-sm">Can be launched without tauri via <code>npm run dev:preview</code>.</div>

    <BookViewTestDND :initial-items="['1', '2', '3', '4', '5']" />

    <div class="flex gap-2">
      <Button
        :variant="r.query.tab === tab ? 'default' : 'outline'"
        v-for="tab in tabs"
        :key="tab"
        @click="() => navigateTo({ query: { tab } })"
      >
        {{ tab }}
      </Button>
    </div>

    <template v-if="r.query.tab === 'Text'">
      <h2 class="text-2xl font-serif font-bold mt-6">Text Input</h2>
      <PreviewTextInputPreview />
    </template>
    <template v-if="r.query.tab === 'Number'">
      <h2 class="text-2xl font-serif font-bold mt-6">Number Input</h2>
      <PreviewNumberInputPreview />
    </template>
    <template v-if="r.query.tab === 'Date'">
      <h2 class="text-2xl font-serif font-bold mt-6">Date Input</h2>
      <PreviewDateInputPreview />
    </template>
    <template v-if="r.query.tab === 'DatesPairCollection'">
      <h2 class="text-2xl font-serif font-bold mt-6">Dates Pair Collection</h2>
      <PreviewDatesPairInputPreview />
    </template>
    <template v-if="r.query.tab === 'DateCollection'">
      <h2 class="text-2xl font-serif font-bold mt-6">Date Collection</h2>
      <PreviewDateCollectionInputPreview />
    </template>
    <template v-if="r.query.tab === 'TextCollection'">
      <h2 class="text-2xl font-serif font-bold mt-6">Text Collection</h2>
      <PreviewTextCollectionInputPreview />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { SchemaAttrType } from '~/types';

const tabs: SchemaAttrType['type'][] = [
  'Text',
  'Number',
  'Date',
  'DatesPairCollection',
  'DateCollection',
  'TextCollection',
];
const r = useRoute();

onMounted(() => {
  if (!r.query.tab) {
    r.query.tab = tabs[0];
  }
});

definePageMeta({
  layout: 'empty',
});
</script>
