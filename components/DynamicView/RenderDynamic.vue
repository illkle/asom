<template>
  <slot name="header" :group="group" />
  <div class="w-full" :style="getStyle(group)">
    <template v-for="(subcategory, index) in group.content">
      <template v-if="subcategory.type === 'item'">
        <slot :data="subcategory" :group="group" :index="index" />
      </template>
      <RenderDynamic v-else :group="subcategory">
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
</template>

<script setup lang="ts">
import type { IDynamicViewGroup } from './helpers';

import { getStyle } from './helpers';

const props = defineProps<{
  group: IDynamicViewGroup;
}>();
</script>
