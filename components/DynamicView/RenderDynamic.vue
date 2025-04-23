<template>
  <div :class="props.class">
    <slot name="header" :group="group" />
    <div :style="getStyle(group)">
      <template v-for="(subcategory, index) in group.content">
        <div v-if="subcategory.type === 'item'">
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

import { getStyle } from './helpers';

const props = defineProps<{
  group: IDynamicViewGroup;
  class?: string;
}>();
</script>
