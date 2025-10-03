<template>
  <PageTemplate>
    <Input v-model="input" />
    <TestPageSub />

    {{ f.foldersAsTree.value.map((v) => v.name + '_' + v.hasSchema) }}

    <div class="flex">
      <div class="">
        <div class="p-4 flex flex-col items-center justify-center gap-8">
          <div class="text-5xl font-serif font-light">asom</div>
          <div class="">
            <LoaderAnimated />

            <LoaderAnimated size="lg" />
          </div>
        </div>
      </div>
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
const input = ref('Test');
import LoaderAnimated from '../Modules/LoaderAnimated.vue';
import Input from '../ui/input/Input.vue';
import PageTemplate from '../Views/Schema/common/PageTemplate.vue';
import TestPageSub from './TestPageSub.vue';

provide('hello', input);

const f = useFoldersList();
</script>
