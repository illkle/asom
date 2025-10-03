<template>
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

  <template v-if="r.query.tab === 'LayoutEdit'">
    <LayoutEdit />
  </template>

  <template v-if="r.query.tab === 'Text'">
    <h2 class="text-2xl font-serif font-bold mt-6">Text Input</h2>
    <TextInputPreview />
  </template>
  <template v-if="r.query.tab === 'Number'">
    <h2 class="text-2xl font-serif font-bold mt-6">Number Input</h2>
    <NumberInputPreview />
  </template>
  <template v-if="r.query.tab === 'Date'">
    <h2 class="text-2xl font-serif font-bold mt-6">Date Input</h2>
    <DateInputPreview />
  </template>
  <template v-if="r.query.tab === 'DatesPairCollection'">
    <h2 class="text-2xl font-serif font-bold mt-6">Dates Pair Collection</h2>
    <DatesPairInputPreview />
  </template>
  <template v-if="r.query.tab === 'DateCollection'">
    <h2 class="text-2xl font-serif font-bold mt-6">Date Collection</h2>
    <DateCollectionInputPreview />
  </template>
  <template v-if="r.query.tab === 'TextCollection'">
    <h2 class="text-2xl font-serif font-bold mt-6">Text Collection</h2>
    <TextCollectionInputPreview />
  </template>
</template>

<script setup lang="ts">
import DateCollectionInputPreview from '~/components/__preview/Inputs/DateCollectionInputPreview.vue';
import DateInputPreview from '~/components/__preview/Inputs/DateInputPreview.vue';
import DatesPairInputPreview from '~/components/__preview/Inputs/DatesPairInputPreview.vue';
import NumberInputPreview from '~/components/__preview/Inputs/NumberInputPreview.vue';
import TextCollectionInputPreview from '~/components/__preview/Inputs/TextCollectionInputPreview.vue';
import TextInputPreview from '~/components/__preview/Inputs/TextInputPreview.vue';
import LayoutEdit from './LayoutEdit.vue';

const tabs: string[] = [
  'Text',
  'Number',
  'Date',
  'DatesPairCollection',
  'DateCollection',
  'TextCollection',
  'LayoutEdit',
];
const r = useRoute();

onMounted(() => {
  if (!r.query.tab && tabs[0]) {
    r.query.tab = tabs[0];
  }
});
</script>
