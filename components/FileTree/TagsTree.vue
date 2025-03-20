<template>
  <div>
    <TreeCell
      v-for="tag in data"
      :key="tag"
      :name="tag"
      :is-tag="true"
      :selected="openedTag === tag"
      @click.exact="select(tag, { place: 'current', focus: true })"
      @click.alt="select(tag, { place: 'next' })"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import TreeCell from '~/components/FileTree/TreeCell.vue';
import { getDefaultViewSettings } from '~/utils/getDefaultViewSettings';

import { c_get_all_tags } from '~/api/tauriActions';
import { useTabsStore, type OpenNewOneParams } from '~/composables/stores/useTabsStore';

const ts = useTabsStore();
const { data, refresh } = useAsyncData(() => {
  return c_get_all_tags();
});

const openedTag = computed(() => ts.openedItem && ts.openedItem.thing);

const select = (tag: string, params: OpenNewOneParams) => {
  ts.openNewOne(
    {
      id: ts.generateRandomId(),
      type: 'tag',
      thing: tag,
      scrollPosition: 0,
      settings: getDefaultViewSettings(),
    },
    params,
  );
};
</script>

<style scoped></style>
