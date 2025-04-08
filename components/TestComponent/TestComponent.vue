<template>
  <Input v-model="string" />
  Modifying string: {{ q.data.value }}
  <Input v-model="object.a" />
  Modifying object: {{ q2.data.value }}

  Modifying object passing string: {{ q3.data.value }}

  <Input v-model="shallowObject.a" />
  Modifying shallow object: {{ q4.data.value }}

  <br />

  <Input v-model="forSub" />
  <Input v-model="forSubObject.a" />

  {{ forSubObject.a }}
  <SubComponent :thing-string="forSubObject.a" :thing-object="forSubObject" />
</template>

<script setup lang="ts">
import SubComponent from './SubComponent.vue';
import { useObjectThing, useThing } from './useThing';

const string = ref('');

const { q } = useThing(string.value);

const object = ref({ a: '123' });

const { q: q2 } = useObjectThing(object.value);

const { q: q3 } = useThing(object.value.a);

const shallowObject = shallowRef({ a: '1234' });

const { q: q4 } = useObjectThing(shallowObject.value);

const forSub = ref<string>('string');
const forSubObject = ref<{ a: string }>({ a: '123' });
</script>
