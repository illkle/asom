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
import { cloneDeep as _cloneDeep } from 'lodash';
import { computed } from 'vue';
import { useMainStore } from '~/composables/stores/useMainStore';
import TreeCell from '~/components/FileTree/TreeCell.vue';
import { getDefaultViewSettings } from '~/utils/getDefaultViewSettings';

import { c_get_all_tags } from '~/api/tauriActions';

const store = useMainStore();
const { data, refresh } = useAsyncData(() => {
  return c_get_all_tags();
});

const openedTag = computed(
  () => store.openedItem && store.openedItem.type === 'tag' && store.openedItem.thing,
);

const select = (tag: string, params: OpenNewOneParams) => {
  store.openNewOne(
    {
      id: store.generateRandomId(),
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
