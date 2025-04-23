<template>
  <div :class="props.class">
    <slot name="header" :group="group" />
    <div
      :style="{
        display: 'flex',
        flexDirection: group.style.direction,
        gap: group.style.gap + 'px',
        alignItems: mapAlign[group.style.align],
        justifyContent: mapJustify[group.style.justify],
      }"
    >
      <template v-for="(subcategory, index) in group.subcategories">
        <div v-if="typeof subcategory === 'string'">
          <slot :data="subcategory" :group="group" :index="index" />
        </div>
        <RenderDynamic v-else :group="subcategory" :class="props.class">
          <!-- @vue-expect-error This is correct, but ts is stuck because recursive type -->
          <template #default="{ data, group, index }">
            <slot :data="data" :group="group" :index="index" />
          </template>
          <!-- @vue-expect-error This is correct, but ts is stuck because recursive type -->
          <template #header="{ group }">
            <slot name="header" :group="group" />
          </template>
        </RenderDynamic>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IDynamicViewGroup } from './helpers';

const mapAlign: Record<IDynamicViewGroup['style']['align'], string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

const mapJustify: Record<IDynamicViewGroup['style']['justify'], string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

const props = defineProps<{
  group: IDynamicViewGroup;
  class?: string;
}>();
</script>
