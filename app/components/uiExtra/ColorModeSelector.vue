<template>
  <RadioGroupRoot v-model="colorMode.preference" class="flex border rounded-md">
    <RadioGroupItem
      value="light"
      class="data-[state=checked]:bg-accent grow flex items-center justify-center rounded-md py-1"
    >
      <SunIcon :size="16" />
    </RadioGroupItem>
    <RadioGroupItem
      value="system"
      class="data-[state=checked]:bg-accent grow flex items-center justify-center rounded-md py-1"
    >
      <SunMoonIcon :size="16" />
    </RadioGroupItem>
    <RadioGroupItem
      value="dark"
      class="data-[state=checked]:bg-accent grow flex items-center justify-center rounded-md py-1"
    >
      <MoonIcon :size="16" />
    </RadioGroupItem>
  </RadioGroupRoot>
</template>

<script setup lang="ts">
import { MoonIcon, SunIcon, SunMoonIcon } from 'lucide-vue-next';
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui';

const colorMode = useColorMode();
</script>
