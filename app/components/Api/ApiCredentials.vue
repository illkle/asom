<template>
  <PageTemplate>
    <template #title> Api Credentials </template>

    <template #header> </template>

    <div v-if="q.data.value">
      <h2 class="text-lg font-serif mt-4 mb-2">OpenLibrary</h2>

      <div>
        <h3 class="text-sm text-muted-foreground">Your email</h3>
        <Input
          :model-value="q.data.value?.olb_yourEmail"
          @update:model-value="
            (v) =>
              mutateUpdater((vv) => {
                vv.olb_yourEmail = v as string;
                return vv;
              })
          "
        />
        <span class="text-xs text-gray-500">
          This email is sent directly to Open Library API. They will contact you if you use it too
          much(unlikely to ever happen).
        </span>
      </div>

      <h2 class="text-lg font-serif mt-4">IGDB</h2>

      <span class="text-xs text-gray-500">
        Login with Twitch and create an application at
        <a href="https://dev.twitch.tv/console/apps" target="_blank"
          >https://dev.twitch.tv/console/apps</a
        >
      </span>

      <div class="flex gap-2 mt-2">
        <div class="grow">
          <h3 class="text-sm text-muted-foreground">Client ID</h3>
          <Input
            :model-value="q.data.value.igdb_clientId"
            @update:model-value="
              (v) =>
                mutateUpdater((vv) => {
                  vv.igdb_clientId = v as string;
                  return vv;
                })
            "
          />
        </div>

        <div class="grow">
          <div class="text-sm text-muted-foreground">Client Secret</div>
          <Input
            :model-value="q.data.value.igdb_clientSecret"
            @update:model-value="
              (v) =>
                mutateUpdater((vv) => {
                  vv.igdb_clientSecret = v as string;
                  return vv;
                })
            "
          />
        </div>
      </div>
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import PageTemplate from '~/components/Views/Schema/common/PageTemplate.vue';

const { q, mutateUpdater } = useApiCredentials();
</script>
