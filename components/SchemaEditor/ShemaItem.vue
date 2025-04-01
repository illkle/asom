<template>
  <Button size="icon" variant="ghost" @click="isOpened = !isOpened">
    <div class="flex w-6 items-center justify-center">
      <ChevronRight v-if="!isOpened" class="w-5" />
      <ChevronDown v-else class="w-5" />
    </div>
  </Button>
  <UIBasicInput v-model="item.name" placeholder="Name" class="basis-36" />

  <Select v-model:model-value="item.value.type">
    <SelectTrigger>
      {{ item.value.type }}
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="k in AttrValueKeys" :value="k">{{ k }}</SelectItem>
    </SelectContent>
  </Select>

  <Button size="icon" variant="ghost" @click="emit('delete')">
    <div class="flex w-6 items-center justify-center">
      <DeleteIcon class="w-5" />
    </div>
  </Button>

  <div v-if="isOpened" class="col-span-4 flex items-stretch gap-2">
    <div class="flex w-11 items-center justify-center">
      <div class="h-full w-[1px] bg-neutral-400 dark:bg-neutral-600"></div>
    </div>
    <div class="flex w-full flex-col gap-2">
      <template v-if="item.value.type === 'Text'">
        <h5>Display Name</h5>
        <UIBasicInput v-model="item.value.settings.displayName" />

        <h5>Font</h5>
        <Select v-model:model-value="item.value.settings.font" class="w-full">
          <SelectTrigger class="w-full">
            {{ item.value.settings?.font || 'Default' }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Serif">Serif</SelectItem>
            <SelectItem value="Sans">Sans</SelectItem>
          </SelectContent>
        </Select>

        <h5>Theme</h5>
        <Select v-model:model-value="item.value.settings.theme" class="w-full">
          <SelectTrigger class="w-full">
            {{ item.value.settings.theme || 'Default' }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Default">Default</SelectItem>
            <SelectItem value="Hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>

        <h5>Weight</h5>
        <Select v-model:model-value="item.value.settings.weight" class="w-full">
          <SelectTrigger class="w-full">
            {{ item.value.settings.weight || 'Default' }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Light">Light</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Bold">Bold</SelectItem>
            <SelectItem value="Black">Black</SelectItem>
          </SelectContent>
        </Select>

        <div class="mt-2 flex items-center gap-2">
          <Checkbox id="isMultiline" v-model="item.value.settings.isMultiline" />
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
        <Select v-model:model-value="item.value.settings.style" class="w-full">
          <SelectTrigger class="w-full">
            {{ item.value.settings.style || 'Default' }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Default">Default</SelectItem>
            <SelectItem value="Stars">Stars</SelectItem>
            <SelectItem value="Slider">Slider</SelectItem>
          </SelectContent>
        </Select>

        <h5>Decimal places</h5>
        <UIBasicInput v-model:number="item.value.settings.decimalPlaces" isNumber min="0" />
      </template>

      <template v-else-if="item.value.type === 'TextCollection'">
        <h5>Display Name</h5>
        <UIBasicInput v-model="item.value.settings.displayName" />

        <h5>Size</h5>
        <Select v-model:model-value="item.value.settings.size" class="w-full">
          <SelectTrigger class="w-full">
            {{ item.value.settings.size || 'Default' }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="S">S</SelectItem>
            <SelectItem value="M">M</SelectItem>
            <SelectItem value="L">L</SelectItem>
          </SelectContent>
        </Select>

        <h5>Font</h5>
        <Select v-model:model-value="item.value.settings.font" class="w-full">
          <SelectTrigger class="w-full">
            {{ item.value.settings?.font || 'Default' }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Serif">Serif</SelectItem>
            <SelectItem value="Sans">Sans</SelectItem>
          </SelectContent>
        </Select>

        <h5>Weight</h5>
        <Select v-model:model-value="item.value.settings.weight" class="w-full">
          <SelectTrigger class="w-full">
            {{ item.value.settings.weight || 'Default' }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Light">Light</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Bold">Bold</SelectItem>
          </SelectContent>
        </Select>

        <h5>Prefix</h5>
        <UIBasicInput v-model="item.value.settings.prefix" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronRight, XIcon as DeleteIcon } from 'lucide-vue-next';
import type { SchemaItem } from '~/types';
import { AttrValueKeys } from '~/types';

const isOpened = ref(false);

const item = defineModel<SchemaItem>({ required: true });

const emit = defineEmits<{
  (e: 'delete'): void;
}>();
</script>
