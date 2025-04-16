<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: group.style.direction,
      gap: group.style.gap + 'px',
      alignItems: mapAlign[group.style.align],
      justifyContent: mapJustify[group.style.justify],
    }"
  >
    <div v-for="subcategory in group.subcategories">
      <div v-if="typeof subcategory === 'string'">
        <slot :data="subcategory" />
      </div>
      <RenderDynamic v-else :group="subcategory">
        <!-- @vue-expect-error This is correct, but ts is stuck because recursive type -->
        <template #default="{ data }">
          <slot :data="data" />
        </template>
      </RenderDynamic>
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
}>();
</script>
