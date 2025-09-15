<template>
  <div>
    <ApiSearch
      v-model="search"
      :query="q"
      placeholder="Search for a game from IGDB"
      @select="(v) => emit('select', v)"
    >
      <template #item="{ item: game }: { item: IgdbApiGame }">
        <img
          v-if="game.cover"
          :src="game.cover"
          class="w-18 h-24 object-cover block rounded-sm overflow-hidden shrink-0"
        />
        <div v-else class="w-18 h-24 block rounded-sm overflow-hidden bg-muted opacity-10"></div>

        <div class="flex flex-col text-left">
          <span class="text-lg">
            {{ game.name }}
          </span>
          <span class="text-regular text-muted-foreground">{{
            game.first_release_date?.getFullYear()
          }}</span>
          <div v-if="game.companies_all" class="text-sm text-muted-foreground">
            {{ game.companies_all.join(', ') }}
          </div>
          <div v-if="game.platforms" class="text-xs text-muted-foreground">
            {{ game.platforms.join(', ') }}
          </div>
        </div>
      </template>
    </ApiSearch>
  </div>
</template>

<script lang="ts" setup>
import { refDebounced } from '@vueuse/core';
import { type ApiSettingsIGDB, type IgdbApiGame } from '~/components/Api/IGDB';
import { getGamesFromIGDB } from '~/components/Api/IGDB/igdb';
import ApiSearch from '../common/ApiSearch.vue';

const data = defineModel<ApiSettingsIGDB>();

const search = ref('');
const debouncedSearch = refDebounced(search, 100);

const q = useQuery({
  key: () => ['igdb', 'search', debouncedSearch.value],
  query: async (a) => {
    if (!data.value) return [];
    const games = await getGamesFromIGDB({
      token: data.value.accessToken ?? '',
      clientId: data.value.clientId,
      clientSecret: data.value.clientSecret,
      name: debouncedSearch.value,
      limit: 25,
      saveToken: (token) => {
        if (!data.value) return;
        data.value.accessToken = token;
      },
    });

    return games;
  },
});

const games = computed(() => q.data.value ?? []);

const emit = defineEmits<{
  (e: 'select', game: IgdbApiGame): void;
}>();
</script>
