<template>
  <div>
    {{ stateRemote }}
  </div>

  <div v-if="editableData">
    raw input
    <Input v-model="editableData.a.text" />

    sub component v-model

    <SubComp v-model="editableData" />
  </div>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es';
import SubComp from './SubComp.vue';

const stateRemote = ref({
  a: {
    text: '12312323',
  },
  b: {
    text: '12312323',
  },
});

const q = useQuery({
  key: () => ['testPage'],
  query: () => Promise.resolve(cloneDeep(stateRemote.value)),
  refetchOnWindowFocus: true,
  refetchOnMount: true,
  refetchOnReconnect: true,
});

const qc = useQueryCache();

const update = async (newValue: typeof stateRemote.value) => {
  qc.setQueryData(['testPage'], {
    ...newValue,
  });

  stateRemote.value = newValue;
};

const editableData = useEditableRef(q, update);
</script>
