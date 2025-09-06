<template>
  <div>
    <Input
      v-model="search"
      autofocus
      placeholder="Search for a game from IGDB"
      class="w-full"
      :class="{ 'rounded-b-none': games.length > 0 }"
    />

    <div
      v-if="games.length > 0"
      class="flex flex-col max-h-[300px] overflow-y-auto scrollbarMod border border-t-0 rounded-b-md"
    >
      <button
        v-for="game in games"
        :key="game.id"
        class="flex gap-4 hover:bg-muted py-2 px-2"
        @click="emit('select', game)"
      >
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
          <div class="text-sm text-muted-foreground">{{ game.companies_all.join(', ') }}</div>
          <div class="text-xs text-muted-foreground">{{ game.platforms.join(', ') }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { refDebounced } from '@vueuse/core';
import { type ApiSettingsIGDB, type IgdbApiGame } from '~/components/Api/IGDB';
import { getGamesFromIGDB } from '~/components/Api/IGDB/igdb';

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
