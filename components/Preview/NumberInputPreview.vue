<template>
  <template v-for="key in Object.keys(possibleValues)" :key="key">
    <h3 class="text-lg font-bold">{{ key }}</h3>
    <div class="grid grid-cols-3 gap-4">
      <div v-for="value in possibleValues[key as keyof SettingsOptions<NumberSettings>]">
        <h5 class="text-sm opacity-20">{{ value ?? 'undefined' }}</h5>
        <NumberInput
          v-model="vals[String(key) + String(value)]"
          :settings="{ ...defaultTextSettings, [key]: value }"
          name="test"
        />
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import type { NumberSettings } from '~/types';
import NumberInput from '../Editor/Inputs/NumberInput.vue';
import type { SettingsOptions } from './helpers';

const vals: Record<string, number | null> = {};

const defaultTextSettings: NumberSettings = {
  displayName: 'Test',
  size: 'M',
  style: 'Default',
  settingsType: 'Num',
};

const possibleValues: SettingsOptions<NumberSettings> = {
  size: ['S', 'M', 'L'],
  min: [undefined, 0, 10],
  max: [undefined, 10, 20],
  decimalPlaces: [undefined, 0, 1, 5],
  style: ['Default', 'Slider', 'Stars'],
};
</script>
