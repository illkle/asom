<template>
  <div class="h-screen border-red-500 border w-full flex flex-col">
    <div class="h-16 bg-green-500"></div>
    <div class="w-full border-blue-500 border overflow-auto overscroll-none">
      <div class="h-[1000px] w-full bg-yellow-500"></div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.dense {
  grid-auto-flow: dense;
}
</style>
