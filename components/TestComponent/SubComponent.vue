<template>
  <div>
    Thing string {{ thingString }}
    <div>String: {{ q1.data.value }}</div>
    <div>Object: {{ q2.data.value }}</div>
  </div>
</template>

<script setup lang="ts">
import { useObjectThing } from './useThing';

const props = defineProps({
  thingString: {
    type: String,
    required: true,
  },
  thingObject: {
    type: Object as PropType<{ a: string }>,
    required: true,
  },
});

const computedString = computed(() => {
  return { a: props.thingString };
});

const { q: q1 } = useObjectThing(computedString.value);
const { q: q2 } = useObjectThing(props.thingObject);
</script>
