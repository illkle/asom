<template>
  <div class="bg-background h-full overflow-y-auto gutter-stable scrollbarMod p-4">
    <template v-if="apiConnections.q.data.value">
      <h2 class="text-2xl font-bold mb-2">Twitch IGDB</h2>
      <span class="text-sm text-muted-foreground mb-4 block"
        >https://api-docs.igdb.com/#getting-started</span
      >

      <div class="flex gap-4 items-end mb-6">
        <div class="flex-1">
          <h4 class="text-sm font-medium mb-1">Client ID</h4>
          <Input v-model="twitchigdb_clientId" />
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-medium mb-1">Client secret</h4>
          <Input v-model="twitchigdb_clientSecret" type="password" />
        </div>

        <Button :disabled="!canSaveTwitchigdb" @click="save">Save</Button>
      </div>
    </template>

    <div class="mb-4">
      <Input v-model="search" placeholder="Search games..." class="w-full" />
    </div>

    <div>{{ apiConnections.q.data.value }}</div>

    <div v-if="q.isLoading.value" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <div v-else-if="q.data.value" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="game in q.data.value"
        :key="game.id"
        class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex">
          <img
            v-if="game.cover"
            :src="game.cover.replace('t_thumb', 't_cover_big')"
            class="w-24 h-full object-cover"
            :alt="game.name"
          />
          <div v-else class="w-24 h-32 bg-muted flex items-center justify-center">
            <span class="text-xs text-muted-foreground">No cover</span>
          </div>

          <div class="p-3 flex-1">
            <h3 class="font-bold text-lg mb-1 line-clamp-1">{{ game.name }}</h3>

            <div class="text-sm text-muted-foreground mb-2">
              {{ game.first_release_date?.toLocaleDateString() }}
            </div>

            <div v-if="game.genres?.length" class="text-xs mb-2">
              <span class="font-medium">Genres:</span>
              {{ game.genres.map((g) => g).join(', ') }}
            </div>

            <div v-if="game.companies_developers?.length" class="text-xs mb-2">
              <span class="font-medium">Developers:</span>
              {{ game.companies_developers.map((v) => v).join(', ') }}
            </div>

            <div v-if="game.rating" class="text-xs">
              <span class="font-medium">Rating:</span>
              {{ Math.round(game.rating) }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import { useTwitchIGDB } from '~/api/external/igb';

const apiConnections = useApiConnections();
const twitchigdb_clientId = ref('');
const twitchigdb_clientSecret = ref('');

watch(
  apiConnections.q.data,
  (value) => {
    if (value) {
      twitchigdb_clientId.value = value.twitchigdb_clientId || '';
      twitchigdb_clientSecret.value = value.twitchigdb_clientSecret || '';
    }
  },
  { immediate: true },
);

const canSaveTwitchigdb = computed(() => {
  return (
    apiConnections.q.data.value?.twitchigdb_clientId !== twitchigdb_clientId.value ||
    apiConnections.q.data.value?.twitchigdb_clientSecret !== twitchigdb_clientSecret.value
  );
});

const save = () => {
  apiConnections.update({
    twitchigdb_clientId: twitchigdb_clientId.value,
    twitchigdb_clientSecret: twitchigdb_clientSecret.value,
  });
};

const igb = useTwitchIGDB();

const search = ref('');
const debouncedSearch = refDebounced(search, 300);

const q = useQuery({
  key: computed(() => ['igb-search', debouncedSearch.value]),
  query: () => igb.searchGames(debouncedSearch.value),
  enabled: computed(() => debouncedSearch.value.length > 2),
});
</script>
