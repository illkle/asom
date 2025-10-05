<template>
  <template v-for="key in Object.keys(possibleValues)" :key="key">
    <h3 class="text-lg font-bold">{{ key }}</h3>
    <div class="grid grid-cols-3 gap-4">
      <div v-for="value in possibleValues[key as keyof SettingsOptions<TextSettings>]">
        <h5 class="text-sm opacity-20">{{ value }}</h5>
        <Text
          v-model="inputValue"
          :settings="{ ...defaultTextSettings, [key]: value }"
          name="test"
        />
      </div>
    </div>
  </template>
  <div class="grid grid-cols-3 gap-4">
    <h3 class="text-lg font-bold">Extras</h3>
    <div v-for="extra in extras">
      <h5 class="text-sm opacity-20">{{ extra.label }}</h5>
      <Text v-model="inputValue" :settings="extra.settings" name="test" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Text from '~/components/Views/Editor/Inputs/Text.vue';
import type { TextSettings } from '~/types';
import type { SettingsOptions } from '../helpers';

const inputValue = ref('Sample text');

const defaultTextSettings: TextSettings = {
  displayName: 'Test',
  size: 'M',
  font: 'Sans',
  weight: 'Normal',
  settingsType: 'Text',
};

const possibleValues: SettingsOptions<TextSettings> = {
  size: ['S', 'M', 'L'],
  font: ['Sans', 'Serif'],
  weight: ['Light', 'Normal', 'Bold', 'Black'],
  isMultiline: [false, true],
};

const extras: { label: string; settings: TextSettings }[] = [
  {
    label: 'Mutiline variation',
    settings: {
      ...defaultTextSettings,
      isMultiline: true,
      size: 'L',
      font: 'Serif',
    },
  },
];
</script>
