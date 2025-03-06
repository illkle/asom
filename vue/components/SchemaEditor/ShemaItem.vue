<template>
  <ShButton size="icon" variant="ghost" @click="isOpened = !isOpened">
    <div class="flex w-6 items-center justify-center">
      <ChevronRight v-if="!isOpened" class="w-5" />
      <ChevronDown v-else class="w-5" />
    </div>
  </ShButton>
  <UIBasicInput v-model="item.name" placeholder="Name" class="basis-36" />

  <ShSelect v-model:model-value="item.value.type">
    <ShSelectTrigger>
      {{ item.value.type }}
    </ShSelectTrigger>
    <ShSelectContent>
      <ShSelectItem v-for="k in AttrValueKeys" :value="k">{{ k }}</ShSelectItem>
    </ShSelectContent>
  </ShSelect>

  <ShButton size="icon" variant="ghost" @click="emit('delete')">
    <div class="flex w-6 items-center justify-center">
      <DeleteIcon class="w-5" />
    </div>
  </ShButton>

  <div v-if="isOpened" class="col-span-4 flex items-stretch gap-2">
    <div class="flex w-11 items-center justify-center">
      <div class="h-full w-[1px] bg-neutral-400 dark:bg-neutral-600"></div>
    </div>
    <div class="flex w-full flex-col gap-2">
      <template v-if="item.value.type === 'Text'">
        <h5>Display Name</h5>
        <UIBasicInput v-model="item.value.settings.displayName" />

        <h5>Font</h5>
        <ShSelect v-model:model-value="item.value.settings.font" class="w-full">
          <ShSelectTrigger class="w-full">
            {{ item.value.settings?.font || 'Default' }}
          </ShSelectTrigger>
          <ShSelectContent>
            <ShSelectItem value="Serif">Serif</ShSelectItem>
            <ShSelectItem value="Sans">Sans</ShSelectItem>
          </ShSelectContent>
        </ShSelect>

        <h5>Theme</h5>
        <ShSelect v-model:model-value="item.value.settings.theme" class="w-full">
          <ShSelectTrigger class="w-full">
            {{ item.value.settings.theme || 'Default' }}
          </ShSelectTrigger>
          <ShSelectContent>
            <ShSelectItem value="Default">Default</ShSelectItem>
            <ShSelectItem value="Hidden">Hidden</ShSelectItem>
          </ShSelectContent>
        </ShSelect>

        <h5>Weight</h5>
        <ShSelect v-model:model-value="item.value.settings.weight" class="w-full">
          <ShSelectTrigger class="w-full">
            {{ item.value.settings.weight || 'Default' }}
          </ShSelectTrigger>
          <ShSelectContent>
            <ShSelectItem value="Light">Light</ShSelectItem>
            <ShSelectItem value="Normal">Normal</ShSelectItem>
            <ShSelectItem value="Bold">Bold</ShSelectItem>
            <ShSelectItem value="Black">Black</ShSelectItem>
          </ShSelectContent>
        </ShSelect>

        <div class="mt-2 flex items-center gap-2">
          <ShCheckbox id="isMultiline" v-model="item.value.settings.isMultiline" />
          <label for="isMultiline">Allow multiple lines</label>
        </div>
      </template>

      <template v-else-if="item.value.type === 'Number'">
        <h5>Display Name</h5>
        <UIBasicInput v-model="item.value.settings.displayName" />

        <h5>Min value</h5>
        <UIBasicInput v-model:number="item.value.settings.min" isNumber />
        <h5>Max value</h5>
        <UIBasicInput v-model:number="item.value.settings.max" isNumber />

        <h5>Style</h5>
        <ShSelect v-model:model-value="item.value.settings.style" class="w-full">
          <ShSelectTrigger class="w-full">
            {{ item.value.settings.style || 'Default' }}
          </ShSelectTrigger>
          <ShSelectContent>
            <ShSelectItem value="Default">Default</ShSelectItem>
            <ShSelectItem value="Stars">Stars</ShSelectItem>
            <ShSelectItem value="Slider">Slider</ShSelectItem>
          </ShSelectContent>
        </ShSelect>

        <h5>Decimal places</h5>
        <UIBasicInput v-model:number="item.value.settings.decimalPlaces" isNumber min="0" />
      </template>

      <template v-else-if="item.value.type === 'TextCollection'">
        <h5>Display Name</h5>
        <UIBasicInput v-model="item.value.settings.displayName" />

        <h5>Size</h5>
        <ShSelect v-model:model-value="item.value.settings.size" class="w-full">
          <ShSelectTrigger class="w-full">
            {{ item.value.settings.size || 'Default' }}
          </ShSelectTrigger>
          <ShSelectContent>
            <ShSelectItem value="S">S</ShSelectItem>
            <ShSelectItem value="M">M</ShSelectItem>
            <ShSelectItem value="L">L</ShSelectItem>
          </ShSelectContent>
        </ShSelect>

        <h5>Font</h5>
        <ShSelect v-model:model-value="item.value.settings.font" class="w-full">
          <ShSelectTrigger class="w-full">
            {{ item.value.settings?.font || 'Default' }}
          </ShSelectTrigger>
          <ShSelectContent>
            <ShSelectItem value="Serif">Serif</ShSelectItem>
            <ShSelectItem value="Sans">Sans</ShSelectItem>
          </ShSelectContent>
        </ShSelect>

        <h5>Weight</h5>
        <ShSelect v-model:model-value="item.value.settings.weight" class="w-full">
          <ShSelectTrigger class="w-full">
            {{ item.value.settings.weight || 'Default' }}
          </ShSelectTrigger>
          <ShSelectContent>
            <ShSelectItem value="Light">Light</ShSelectItem>
            <ShSelectItem value="Normal">Normal</ShSelectItem>
            <ShSelectItem value="Bold">Bold</ShSelectItem>
          </ShSelectContent>
        </ShSelect>

        <h5>Prefix</h5>
        <UIBasicInput v-model="item.value.settings.prefix" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XIcon as DeleteIcon, ChevronRight, ChevronDown } from 'lucide-vue-next';
import type { SchemaItem } from '~/types';
import { AttrValueKeys } from '~/types';

const isOpened = ref(false);

const item = defineModel<SchemaItem>({ required: true });

const emit = defineEmits<{
  (e: 'delete'): void;
}>();
</script>
