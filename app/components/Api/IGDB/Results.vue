<template>
  <ResultGeneric :query="q" @select="(v) => emits('select', v)">
    <template #item="{ item }">
      <Item :item="item" />
    </template>
  </ResultGeneric>
</template>

<script lang="ts" setup>
import { type ApiSettingsIGDB, type IgdbApiGame } from '~/components/Api/IGDB';
import { getGamesFromIGDB } from '~/components/Api/IGDB/igdb';
import ResultGeneric from '../common/ResultGeneric.vue';
import Item from './Item.vue';

const data = defineModel<ApiSettingsIGDB>();

const props = defineProps<{
  search: string;
}>();

const q = useQuery({
  key: () => ['igdb', 'search', props.search],
  query: async () => {
    if (!data.value || !props.search) return [];
    const games = await getGamesFromIGDB({
      name: props.search,
      limit: 25,
    });

    return games;
  },
});

const emits = defineEmits<{
  (e: 'select', game: IgdbApiGame): void;
}>();
</script>
