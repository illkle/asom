<template>
  <div
    :class="[
      'flex h-10 items-center justify-between border-transparent py-1 transition-all',
      widthAwailable > 100 ? 'px-2 text-sm' : 'px-1 text-xs',
      isActive
        ? 'rounded-tl-md rounded-tr-md bg-neutral-50 dark:bg-neutral-950'
        : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-900 dark:text-neutral-600 dark:hover:bg-neutral-800',
    ]"
  >
    <div class="truncate" :class="isNewAndAnimating && 'animate-new'">
      {{ text }}
    </div>

    <ShButton variant="ghost" size="iconSm" @mousedown.stop @click.stop="emit('close')">
      <XIcon class="text-neutral-300 duration-[0] dark:text-neutral-600" />
    </ShButton>
  </div>
</template>

<script lang="ts" setup>
import { XIcon } from 'lucide-vue-next';

import { computed, type PropType } from 'vue';
import type { IOpened } from '~/api/openedTabs';
import { useMainStore } from '~/composables/stores/useMainStore';

const props = defineProps({
  isNewAndAnimating: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  widthAwailable: {
    type: Number,
    default: 150,
  },
  item: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useMainStore();
const rootPath = useRootPath();

const capitalize = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const text = computed(() => {
  if (!rootPath.data.value || !props.item) return '';
  if (props.item.type === 'folder') {
    if (props.item.thing === rootPath.data.value || !props.item.thing.length) {
      return 'All Books';
    }
    return props.item.thing.replace(rootPath.data.value, '').replace(/[\\/]/, '');
  }

  if (props.item.type === 'file') {
    return props.item.thing.split(/[\\/]/).pop();
  }

  if (props.item.type === 'innerPage') {
    return capitalize(props.item.thing);
  }

  return '';
});
</script>

<style>
.animate-new {
  animation-duration: 0.3s;
  animation-name: tabOpenAnimation;
  animation-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1);
}

@keyframes tabOpenAnimation {
  0% {
    opacity: 0;
    transform: translateY(50%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
