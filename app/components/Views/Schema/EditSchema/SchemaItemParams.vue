<template>
  <template v-if="item.value.type === 'Text'">
    <RadioGroup v-model="item.value.settings.size">
      <RadioGroupItem value="S">S</RadioGroupItem>
      <RadioGroupItem value="M">M</RadioGroupItem>
      <RadioGroupItem value="L">L</RadioGroupItem>
    </RadioGroup>

    <RadioGroup v-model="item.value.settings.font">
      <RadioGroupItem value="Serif">Serif</RadioGroupItem>
      <RadioGroupItem value="Sans">Sans</RadioGroupItem>
    </RadioGroup>

    <RadioGroup v-model="item.value.settings.weight">
      <RadioGroupItem value="Light">Light</RadioGroupItem>
      <RadioGroupItem value="Normal">Normal</RadioGroupItem>
      <RadioGroupItem value="Bold">Bold</RadioGroupItem>
      <RadioGroupItem value="Black">Black</RadioGroupItem>
    </RadioGroup>

    <div class="flex items-center gap-2">
      <Checkbox id="isMultiline" v-model="item.value.settings.isMultiline" />
      <label for="isMultiline">Multiline</label>
    </div>
  </template>

  <template v-else-if="item.value.type === 'Number'">
    <RadioGroup v-model="item.value.settings.size">
      <RadioGroupItem value="S">S</RadioGroupItem>
      <RadioGroupItem value="M">M</RadioGroupItem>
      <RadioGroupItem value="L">L</RadioGroupItem>
    </RadioGroup>
    <RadioGroup v-model="item.value.settings.style">
      <RadioGroupItem value="Default">Default</RadioGroupItem>
      <RadioGroupItem value="Stars">Stars</RadioGroupItem>
      <RadioGroupItem value="Slider">Slider</RadioGroupItem>
    </RadioGroup>

    <template v-if="item.value.settings.style !== 'Stars'">
      <div class="flex">
        <h5
          class="text-sm border whitespace-nowrap flex items-center px-3 rounded-l-md border-r-0 text-muted-foreground"
        >
          Decimal places
        </h5>
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
            <NumberFieldInput class="rounded-l-none" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>
    </template>
    <template v-else>
      <div class="flex">
        <h5
          class="text-sm border whitespace-nowrap flex items-center px-3 rounded-l-md border-r-0 text-muted-foreground"
        >
          Stars
        </h5>
        <NumberField
          :min="1"
          :default-value="5"
          :model-value="item.value.settings.starsCount"
          @update:model-value="item.value.settings.starsCount = $event"
        >
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput class="rounded-none" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>

        <Tooltip>
          <TooltipTrigger class="border px-2 rounded-r-md border-l-0">
            <InfoIcon class="w-4 h-4" />
          </TooltipTrigger>
          <TooltipContent class="max-w-xs">
            Min and value are used for stars too. For example min=0, max=5, stars=5, you will see 5
            stars, but wont be able to select «two and a half», while doing min=0, max=10, stars=5
            will let you do that.
          </TooltipContent>
        </Tooltip>
      </div>
    </template>

    <div class="flex">
      <h5
        class="text-sm border whitespace-nowrap flex items-center px-3 rounded-l-md border-r-0 text-muted-foreground"
      >
        Min
      </h5>
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
          <NumberFieldInput class="rounded-l-none" />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    </div>

    <div class="flex">
      <h5
        class="text-sm border whitespace-nowrap flex items-center px-3 rounded-l-md border-r-0 text-muted-foreground"
      >
        Max
      </h5>
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
          <NumberFieldInput class="rounded-l-none" />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    </div>
  </template>

  <template v-else-if="item.value.type === 'TextCollection'">
    <RadioGroup v-model="item.value.settings.size">
      <RadioGroupItem value="S">S</RadioGroupItem>
      <RadioGroupItem value="M">M</RadioGroupItem>
      <RadioGroupItem value="L">L</RadioGroupItem>
    </RadioGroup>

    <RadioGroup v-model="item.value.settings.font">
      <RadioGroupItem value="Serif">Serif</RadioGroupItem>
      <RadioGroupItem value="Sans">Sans</RadioGroupItem>
    </RadioGroup>

    <RadioGroup v-model="item.value.settings.weight">
      <RadioGroupItem value="Light">Light</RadioGroupItem>
      <RadioGroupItem value="Normal">Normal</RadioGroupItem>
      <RadioGroupItem value="Bold">Bold</RadioGroupItem>
    </RadioGroup>

    <div class="flex">
      <h5
        class="text-sm border whitespace-nowrap flex items-center px-3 rounded-l-md border-r-0 text-muted-foreground"
      >
        Prefix
      </h5>
      <Input v-model="item.value.settings.prefix" class="rounded-l-none" />
    </div>
  </template>

  <template v-else-if="item.value.type === 'Image'">
    <div class="flex">
      <h5
        class="text-sm border whitespace-nowrap flex items-center px-3 rounded-l-md border-r-0 text-muted-foreground"
      >
        Aspect Ratio
      </h5>
      <Input v-model="item.value.settings.aspectRatio" class="rounded-none" />
      <Tooltip>
        <TooltipTrigger class="border px-2 rounded-r-md border-l-0">
          <InfoIcon class="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent>Formatted as "width / height". Example: "16 / 9"</TooltipContent>
      </Tooltip>
    </div>
  </template>

  <template v-else-if="item.value.type === 'Date'"> </template>
  <template v-else-if="item.value.type === 'DateCollection'"> </template>
  <template v-else-if="item.value.type === 'DatesPairCollection'"> </template>
</template>

<script setup lang="ts">
import { InfoIcon } from 'lucide-vue-next';
import { RadioGroup, RadioGroupItem } from '~/components/Modules/CustomRadio';
import type { SchemaItem } from '~/types';

const item = defineModel<SchemaItem>({ required: true });
</script>
