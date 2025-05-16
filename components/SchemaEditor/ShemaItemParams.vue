<template>
  <div class="col-span-4 flex items-stretch gap-2">
    <div class="flex w-11 items-center justify-center">
      <div class="h-full w-[1px] bg-muted"></div>
    </div>
    <div class="flex w-full flex-col gap-2">
      <template v-if="item.value.type === 'Text'">
        <h5>Display Name</h5>
        <Input v-model="item.value.settings.displayName" />

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
        <Input v-model="item.value.settings.displayName" />

        <h5>Min value</h5>
        <NumberField
          :max="item.value.settings.max"
          :model-value="item.value.settings.min"
          @update:model-value="
            (v) => {
              if (item.value.type !== 'Number') return;
              item.value.settings.min = typeof v === 'number' && !isNaN(v) ? v : undefined;
            }
          "
          class="w-fit"
        >
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput v-model:number="item.value.settings.min" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        {{ item.value.settings.min }}
        <h5>Max value</h5>
        <NumberField
          :min="item.value.settings.min"
          :model-value="item.value.settings.max"
          @update:model-value="
            (v) => {
              if (item.value.type !== 'Number') return;
              item.value.settings.max = typeof v === 'number' && !isNaN(v) ? v : undefined;
            }
          "
          class="w-fit"
        >
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput v-model:number="item.value.settings.min" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>

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
        <NumberField
          :min="0"
          :model-value="item.value.settings.decimalPlaces"
          @update:model-value="
            (v) => {
              if (item.value.type !== 'Number') return;
              item.value.settings.decimalPlaces =
                typeof v === 'number' && !isNaN(v) ? v : undefined;
            }
          "
          class="w-fit"
        >
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput v-model:number="item.value.settings.min" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        <span v-if="item.value.settings.style === 'Stars'" class="text-sm text-muted-foreground">
          In Stars mode decimal places act as subdivisions instead. So setting this to 1 will allow
          for "2 and a half star", value of 2 will allow for "2 and three quaters" etc.
        </span>
      </template>

      <template v-else-if="item.value.type === 'TextCollection'">
        <h5>Display Name</h5>
        <Input v-model="item.value.settings.displayName" />

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
        <Input v-model="item.value.settings.prefix" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SchemaItem } from '~/types';

const item = defineModel<SchemaItem>({ required: true });
</script>
