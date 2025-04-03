<template>
  <template v-for="key in Object.keys(possibleValues)" :key="key">
    <h3 class="text-lg font-bold">{{ key }}</h3>
    <div class="grid grid-cols-3 gap-4">
      <div v-for="value in possibleValues[key as keyof SettingsOptions<TextSettings>]">
        <h5 class="text-sm opacity-20">{{ value }}</h5>
        <EditorInputsTextInput
          v-model="inputValue"
          :settings="{ ...defaultTextSettings, [key]: value }"
          name="test"
        />
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import type { TextSettings } from '~/types';
import type { SettingsOptions } from './helpers';

const inputValue = ref('Sample text');

const defaultTextSettings: TextSettings = {
  displayName: 'Test',
  theme: 'Default',
  size: 'M',
  font: 'Sans',
  weight: 'Normal',
  settingsType: 'Text',
};

const possibleValues: SettingsOptions<TextSettings> = {
  theme: ['Default', 'Hidden'],
  size: ['S', 'M', 'L'],
  font: ['Sans', 'Serif'],
  weight: ['Light', 'Normal', 'Bold', 'Black'],
  isMultiline: [false, true],
};
</script>
