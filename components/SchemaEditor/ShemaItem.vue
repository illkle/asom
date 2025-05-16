<template>
  <div class="w-full grid grid-cols-2 gap-4 border-b py-4">
    <div class="flex flex-col gap-1 w-full">
      <div class="flex gap-2 justify-between">
        <Input
          v-model="item.name"
          placeholder="Name"
          class="w-full"
          autofocus
          @blur="editing = false"
        />
      </div>
      <div class="flex gap-2 mt-2">
        <Select v-model:model-value="item.value.type">
          <SelectTrigger class="w-full">
            {{ item.value.type }}
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="k in AttrValueKeys" :value="k">{{ k }}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" @click="emit('delete')">
          <DeleteIcon class="w-5" /> Delete
        </Button>
      </div>
    </div>
    {{ item.value.type }}
    <AttributesRouter v-model:model-value="attvalue" :schema-item="item" hide-label />
  </div>
</template>

<script setup lang="ts">
import { XIcon as DeleteIcon } from 'lucide-vue-next';
import type { AttrValue, DatePair, SchemaItem } from '~/types';
import { AttrValueKeys } from '~/types';
import AttributesRouter from '../Editor/AttributesRouter.vue';

const sampleDate = ref('2020-05-04');
const sampleText = ref('Sample text');
const sampleTextCollection = ref(['Hello', 'World']);
const sampleNumber = ref(123);
const sampleDateCollection = ref(['2020-05-04', '2020-05-05']);
const sampleDatesPairCollection = ref([
  { started: '2025-05-04', finished: '2025-05-05' },
  { started: '2025-05-06', finished: '2025-05-07' },
] as DatePair[]);
const sampleImage = ref('');

const attvalue = computed<AttrValue>({
  get: () => {
    switch (item.value.value.type) {
      case 'Date':
        return {
          type: 'String',
          value: sampleDate.value,
        } as AttrValue;
      case 'Text':
        return {
          type: 'String',
          value: sampleText.value,
        } as AttrValue;
      case 'TextCollection':
        return {
          type: 'StringVec',
          value: sampleTextCollection.value,
        } as AttrValue;
      case 'Number':
        return {
          type: 'Float',
          value: sampleNumber.value,
        } as AttrValue;
      case 'DateCollection':
        return {
          type: 'StringVec',
          value: sampleDateCollection.value,
        } as AttrValue;
      case 'DatesPairCollection':
        return {
          type: 'DatePairVec',
          value: sampleDatesPairCollection.value,
        } as AttrValue;
      case 'Image':
        return {
          type: 'String',
          value: sampleImage.value,
        } as AttrValue;
    }
  },
  set: (value: AttrValue) => {
    switch (item.value.value.type) {
      case 'Date':
        sampleDate.value = value.value as string;
        break;
      case 'Text':
        sampleText.value = value.value as string;
      case 'TextCollection':
        sampleTextCollection.value = value.value as string[];
        break;
      case 'Number':
        sampleNumber.value = value.value as number;
        break;
      case 'DateCollection':
        sampleDateCollection.value = value.value as string[];
        break;
      case 'DatesPairCollection':
        sampleDatesPairCollection.value = value.value as DatePair[];
        break;
      case 'Image':
        sampleImage.value = value.value as string;
        break;
    }
  },
});

const item = defineModel<SchemaItem>({ required: true });

const editing = ref(false);

const props = defineProps<{
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete'): void;
  (e: 'customize'): void;
}>();
</script>
