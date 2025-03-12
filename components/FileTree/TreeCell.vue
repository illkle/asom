<template>
  <div
    :class="
      cn(
        'border border-transparent',
        buttonVariants({
          variant: isRenaming || canDropHere ? 'outline' : selected ? 'default' : 'ghost',
          size: 'compact',
        }),
        'w-full justify-start truncate px-1',
      )
    "
  >
    <div class="mr-1 flex h-3 w-3 cursor-pointer items-center justify-center opacity-50">
      <slot name="leftIcon"></slot>
      <slot></slot>
    </div>
    <div
      v-if="!isRenaming"
      class="pointer-events-none origin-left truncate transition-transform"
      :class="canDropHere && 'scale-110'"
    >
      {{ innerName }}
    </div>

    <div v-else class="w-full shrink">
      <input
        ref="inputName"
        v-model="innerName"
        :class="['w-full bg-transparent outline-none']"
        @blur="saveName"
        @keyup.enter="removeFocus"
        @keyup.escape="removeFocus"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep as _cloneDeep } from 'lodash';
import { ChevronDown, FolderIcon, LibraryIcon, HashIcon } from 'lucide-vue-next';
import { useMainStore } from '~/composables/stores/useMainStore';

import { buttonVariants } from '~/components/_shadcn/button';
import { ref, watch, watchEffect } from 'vue';

const store = useMainStore();

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  canDropHere: {
    type: Boolean,
    default: false,
  },
  canBeFolded: {
    type: Boolean,
    default: false,
  },
  isFolded: {
    type: Boolean,
    default: false,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  isRenaming: {
    type: Boolean,
    default: false,
  },
  preselectName: {
    type: Boolean,
    default: false,
  },
  isRoot: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'foldClick'): void;
  (e: 'saveName', val: string): void;
}>();

const innerName = ref('');

const inputName = ref<HTMLElement | null>(null);

watch(
  () => props.isRenaming,
  () => {
    if (props.isRenaming) {
      innerName.value = props.name;
    }
    if (props.preselectName) {
      inputName.value?.focus();
    }
  },
  { immediate: true },
);

watchEffect(() => {
  innerName.value = props.name;
});

watchEffect(
  () => {
    inputName.value?.focus();
  },
  {
    flush: 'post',
  },
);

const removeFocus = () => {
  inputName.value?.blur();
};

const saveName = () => {
  emit('saveName', innerName.value);
};
</script>
