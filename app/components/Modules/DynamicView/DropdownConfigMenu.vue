<template>
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>Direction</DropdownMenuSubTrigger>
    <DropdownMenuSubContent>
      <DropdownMenuRadioGroup
        :model-value="style.direction"
        @update:model-value="
          (v) =>
            emit('update:style', {
              ...style,
              direction: v as IDynamicViewGroup['style']['direction'],
            })
        "
      >
        <DropdownMenuRadioItem value="row"> Row </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="column"> Column </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuSubContent>
  </DropdownMenuSub>
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>Align</DropdownMenuSubTrigger>
    <DropdownMenuSubContent>
      <DropdownMenuRadioGroup
        :model-value="style.align"
        @update:model-value="
          (v) =>
            emit('update:style', {
              ...style,
              align: v as IDynamicViewGroup['style']['align'],
            })
        "
      >
        <DropdownMenuRadioItem value="start"> Start </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="center"> Center </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="end"> End </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuSubContent>
  </DropdownMenuSub>
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>Justify</DropdownMenuSubTrigger>
    <DropdownMenuSubContent>
      <DropdownMenuRadioGroup
        :model-value="style.justify"
        @update:model-value="
          (v) =>
            emit('update:style', {
              ...style,
              justify: v as IDynamicViewGroup['style']['justify'],
            })
        "
      >
        <DropdownMenuRadioItem value="start"> Start </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="center"> Center </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="end"> End </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="between"> Between </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="around"> Around </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="evenly"> Evenly </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuSubContent>
  </DropdownMenuSub>
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>Gap</DropdownMenuSubTrigger>
    <DropdownMenuSubContent>
      <DropdownMenuRadioGroup
        :model-value="style.gap"
        @update:model-value="(v) => emit('update:style', { ...style, gap: v })"
      >
        <DropdownMenuRadioItem value="0"> 0 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="4"> 4 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="8"> 8 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="16"> 16 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="32"> 32 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="64"> 64 </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuSubContent>
  </DropdownMenuSub>
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>Size Units</DropdownMenuSubTrigger>
    <DropdownMenuSubContent>
      <DropdownMenuRadioGroup
        :model-value="style.sizeUnits"
        @update:model-value="(v) => emit('update:style', { ...style, sizeUnits: v })"
      >
        <DropdownMenuRadioItem value="1"> 1 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="2"> 2 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="3"> 3 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="4"> 4 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="5"> 5 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="6"> 6 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="7"> 7 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="8"> 8 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="9"> 9 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="10"> 10 </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuSubContent>
  </DropdownMenuSub>
</template>

<script setup lang="ts">
import type { IDynamicViewGroup } from './helpers';

const props = defineProps<{
  style: IDynamicViewGroup['style'];
}>();

const emit = defineEmits<{
  (e: 'update:style', value: IDynamicViewGroup['style']): void;
}>();
</script>
