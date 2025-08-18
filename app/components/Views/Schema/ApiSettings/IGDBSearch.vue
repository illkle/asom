<template>
  <div>
    <Input v-model="search" placeholder="Search for a game" class="w-full" />

    <div class="flex flex-col mt-2 max-h-[300px] overflow-y-auto">
      <button
        v-for="game in games"
        :key="game.id"
        class="flex gap-4 hover:bg-muted py-2"
        @click="emit('select', game)"
      >
        <img
          v-if="game.cover"
          :src="game.cover"
          class="w-18 h-24 object-cover block rounded-sm overflow-hidden"
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
import { getGamesFromIGDB, type ApiSettingsIGDB, type IgdbApiGame } from '~/api/external/igb';

const data = defineModel<ApiSettingsIGDB>();

const search = ref('');
const debouncedSearch = refDebounced(search, 500);

const q = useQuery({
  key: () => ['igdb', 'search', debouncedSearch.value],
  query: async () => {
    const games = await getGamesFromIGDB({
      token: data.value.accessToken ?? '',
      clientId: data.value.clientId,
      clientSecret: data.value.clientSecret,
      name: debouncedSearch.value,
      limit: 25,
      saveToken: (token) => (data.value.accessToken = token),
    });

    return games;
  },
});

const games = computed(() => q.data.value ?? []);

const emit = defineEmits<{
  (e: 'select', game: IgdbApiGame): void;
}>();
</script>
