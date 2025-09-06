<template>
  <div class="flex gap-4">
    <Button variant="outline" @click="setAllValues(1)">Set all 1</Button>
    <Button variant="outline" @click="setAllValues(10000)">Set all 10k</Button>
    <Button variant="outline" @click="setAllValues(null)">Set all null</Button>
  </div>
  <template v-for="key in Object.keys(possibleValues)" :key="key">
    <h3 class="text-lg font-bold">{{ key }}</h3>
    <div class="grid grid-cols-3 gap-4">
      <div v-for="value in possibleValues[key as keyof SettingsOptions<NumberSettings>]">
        <h5 class="text-sm opacity-20">{{ value ?? 'undefined' }}</h5>
        <NumberInput
          :model-value="vals[String(key) + String(value)]!"
          @update:model-value="(v) => (vals[String(key) + String(value)] = v)"
          :settings="{ ...defaultNumberSettings, [key]: value }"
          name="test"
        />
      </div>
    </div>
  </template>
  <h3 class="text-lg font-bold">Extras</h3>
  <div class="grid grid-cols-3 gap-4">
    <div v-for="extra in extras">
      <h5 class="text-sm opacity-20">{{ extra.label }}</h5>

      <NumberInput
        v-model="vals[String(extra.label)]!"
        @update:model-value="(v) => (vals[String(extra.label)] = v)"
        :settings="extra.settings"
        name="test"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NumberSettings } from '~/types';
import NumberInput from '../Views/Editor/Inputs/Number.vue';
import type { SettingsOptions } from './helpers';

const vals = ref<Record<string, number | null>>({});

const defaultNumberSettings: NumberSettings = {
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

const setAllValues = (v: number | null) => {
  const keys = Object.keys(possibleValues);
  for (const key of keys) {
    for (const value of possibleValues[key as keyof SettingsOptions<NumberSettings>] ?? []) {
      vals.value[String(key) + String(value)] = v;
    }
  }
  for (const extra of extras) {
    vals.value[String(extra.label)] = v;
  }
};

onBeforeMount(() => {
  setAllValues(1);
});

const extras: { label: string; settings: NumberSettings }[] = [
  {
    label: 'stars two decimal places variation',
    settings: {
      ...defaultNumberSettings,
      style: 'Stars',
      decimalPlaces: 2,
    },
  },
  {
    label: 'stars no decimal places',
    settings: {
      ...defaultNumberSettings,
      style: 'Stars',
      decimalPlaces: 0,
    },
  },
  {
    label: 'stars ten',
    settings: {
      ...defaultNumberSettings,
      style: 'Stars',
      starsCount: 10,
      min: 0,
      max: 10,
    },
  },
  {
    label: 'stars five',
    settings: {
      ...defaultNumberSettings,
      style: 'Stars',
      starsCount: 5,
      min: 0,
      max: 10,
    },
  },

  {
    label: 'slider',
    settings: {
      ...defaultNumberSettings,
      style: 'Slider',
      starsCount: 5,
      min: 0,
      max: 10,
    },
  },

  {
    label: 'slider decimal places',
    settings: {
      ...defaultNumberSettings,
      style: 'Slider',
      starsCount: 5,
      min: 0,
      max: 10,
      decimalPlaces: 4,
    },
  },

  {
    label: 'slider 5 15',
    settings: {
      ...defaultNumberSettings,
      style: 'Slider',
      starsCount: 5,
      min: 5,
      max: 15,
      decimalPlaces: 4,
    },
  },
];
</script>
