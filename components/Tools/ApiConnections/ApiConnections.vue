<template>
  <div class="bg-background h-full overflow-y-auto gutter-stable scrollbarMod p-4">
    <template v-if="apiConnections.q.data.value">
      <h2>Twitch IGDB</h2>
      <span>https://api-docs.igdb.com/#getting-started</span>

      <div class="flex gap-2 items-end">
        <div>
          <h4>Client ID</h4>
          <Input v-model="twitchigdb_clientId" />
        </div>
        <div>
          <h4>Client secret</h4>
          <Input v-model="twitchigdb_clientSecret" />
        </div>

        <Button :disabled="!canSaveTwitchigdb" @click="save">Save</Button>
      </div>
    </template>

    <Input v-model="search" />
    <div v-if="q.data.value" class="flex flex-col gap-2">
      <div v-for="game in q.data.value" :key="game.id" class="flex gap-2 items-center">
        <img :src="game.cover?.url" class="w-10" />
        <div>{{ game.name }}</div>
        <div>
          {{ game.first_release_date_human?.toLocaleDateString() }}
        </div>
        <div>
          {{
            game.involved_companies
              ?.filter((v) => v.developer)
              .map((v) => v.company.name)
              .join(', ')
          }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTwitchIGDB } from '~/api/igb';

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

const q = useQuery({
  key: computed(() => ['igb-search', search.value]),
  query: () => igb.searchGames(search.value),
  enabled: computed(() => search.value.length > 2),
});
</script>
