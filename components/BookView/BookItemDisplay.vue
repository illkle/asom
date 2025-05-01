<template>
  <div
    v-if="props.value"
    class="text-ellipsis max-w-full h-full flex items-center overflow-hidden whitespace-nowrap gap-0.5"
  >
    <template
      v-if="props.type.type === 'DatesPairCollection' && props.value.type === 'DatePairVec'"
    >
      {{ mapPair(props.value.value) }}
    </template>

    <template v-else-if="props.type.type === 'TextCollection' && props.value.type === 'StringVec'">
      <span v-for="v in props.value.value" :key="v" class="border text-xs px-1 py-[1px] rounded-sm">
        {{ v }}
      </span>
    </template>

    <template v-else-if="props.type.type === 'DateCollection' && props.value.type === 'StringVec'">
      {{ mapDatesVec(props.value.value) }}
    </template>

    <template v-else-if="props.type.type === 'Text' && props.value.type === 'String'">
      <span class="text-ellipsis overflow-hidden whitespace-nowrap">
        {{ props.value.value ?? '—' }}
      </span>
    </template>

    <template v-else-if="props.type.type === 'Date' && props.value.type === 'String'">
      <span class="text-ellipsis overflow-hidden whitespace-nowrap">
        {{
          props.value.value
            ? format(parse(props.value.value, 'yyyy-MM-dd', new Date()), 'dd MMM yyyy')
            : ''
        }}
      </span>
    </template>

    <template
      v-else-if="
        props.type.type === 'Number' &&
        (props.value.type === 'Integer' || props.value.type === 'Float')
      "
    >
      <span class="text-ellipsis overflow-hidden whitespace-nowrap font-mono">
        {{ props.value.value ? String(props.value.value) : '—' }}
      </span>
    </template>

    <template v-else>
      <span class="text-ellipsis overflow-hidden whitespace-nowrap text-xs">
        {{ props.type.type }} {{ props.value.type }} Unsupported type
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { format, parse } from 'date-fns';
import type { PropType } from 'vue';
import type { AttrValue, DatePair, SchemaAttrType } from '~/types';

const props = defineProps({
  value: {
    type: Object as PropType<AttrValue>,
  },
  type: {
    type: Object as PropType<SchemaAttrType>,
    required: true,
  },
});

const mapPair = (v: DatePair[] | null) => {
  if (!v) return '';
  return v
    .map((v) =>
      v.started || v.finished
        ? format(parse(v.finished || v.started || '', 'yyyy-MM-dd', new Date()), 'MMM yyyy')
        : '',
    )
    .join(', ');
};

const mapDatesVec = (v: string[] | null) => {
  if (!v) return '';
  return v
    .map((v) => (v ? format(parse(v, 'yyyy-MM-dd', new Date()), 'dd MMM yyyy') : ''))
    .join(', ');
};
</script>
