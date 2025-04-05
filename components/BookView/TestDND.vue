<script setup lang="ts">
import { ref } from 'vue';

const list = ref(['one', 'two', 'three']);
</script>

<template>
  <ul ref="parent" class="number-list">
    <li class="number" v-for="(element, index) in list" :key="element" :index="index">
      {{ element }}
    </li>
  </ul>
</template>
<style>
.number {
  border-style: solid;
  padding-left: 5px;
  margin-top: 0.25rem;
  border-width: 2px;
}
.number-list {
  display: block;
  padding: 10px;
}
</style>
