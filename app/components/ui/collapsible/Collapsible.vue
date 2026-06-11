<script setup lang="ts">
import type { ClassValue } from 'clsx';
import type { CollapsibleRootEmits, CollapsibleRootProps } from 'reka-ui';
import { CollapsibleRoot, useForwardPropsEmits } from 'reka-ui';

const props = defineProps<CollapsibleRootProps & { class?: ClassValue }>();
const emits = defineEmits<CollapsibleRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <CollapsibleRoot
    v-slot="{ open }"
    data-slot="collapsible"
    v-bind="forwarded"
    :class="$props.class"
  >
    <slot :open="open" />
  </CollapsibleRoot>
</template>
