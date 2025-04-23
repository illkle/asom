<template>
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>Direction</DropdownMenuSubTrigger>
    <DropdownMenuSubContent>
      <DropdownMenuRadioGroup v-model="model.direction">
        <DropdownMenuRadioItem value="row"> Row </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="column"> Column </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuSubContent>
  </DropdownMenuSub>
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>Align</DropdownMenuSubTrigger>
    <DropdownMenuSubContent>
      <DropdownMenuRadioGroup v-model="model.align">
        <DropdownMenuRadioItem value="start"> Start </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="center"> Center </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="end"> End </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuSubContent>
  </DropdownMenuSub>
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>Justify</DropdownMenuSubTrigger>
    <DropdownMenuSubContent>
      <DropdownMenuRadioGroup v-model="model.justify">
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
      <DropdownMenuRadioGroup v-model="model.gap">
        <DropdownMenuRadioItem value="0"> 0 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="4"> 4 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="8"> 8 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="16"> 16 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="32"> 32 </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="64"> 64 </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuSubContent>
  </DropdownMenuSub>
</template>

<script setup lang="ts">
import type { IDynamicViewGroup } from './helpers';

const model = defineModel<IDynamicViewGroup['style']>({ required: true });
</script>
