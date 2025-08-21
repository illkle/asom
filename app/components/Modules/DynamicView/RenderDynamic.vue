<template>
  <slot name="header" :group="group" />
  <div class="" :style="getStyleWrapper(group)" :id="`wrapper-${group.id}`">
    <div
      v-for="(subcategory, index) in group.content"
      :id="`group-${subcategory.id}`"
      class="w-full"
      :style="getStyleGroup(subcategory)"
    >
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IDynamicViewGroup } from './helpers';

import { getStyleGroup, getStyleWrapper } from './helpers';

const props = defineProps<{
  group: IDynamicViewGroup;
}>();
</script>
