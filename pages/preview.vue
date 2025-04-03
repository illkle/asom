<template>
  <div class="flex flex-col gap-2 mx-auto px-4 w-full py-10">
    <h1>Area for testing components.</h1>
    <div class="text-sm">Can be launched without tauri via <code>npm run dev:preview</code>.</div>

    <h2 class="text-2xl font-serif font-bold mt-6">Text Input</h2>
    <PreviewTextInputPreview />

    <h2 class="text-2xl font-serif font-bold mt-6">Number Input</h2>
    <PreviewNumberInputPreview />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'empty',
});
</script>
