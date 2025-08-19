<template>
  <div
    :class="[
      'flex h-10 items-center justify-between border-transparent py-1 transition-all',
      widthAwailable > 100 ? 'px-2 text-sm' : 'px-1 text-xs',
      isActive ? 'rounded-tl-md rounded-tr-md bg-background' : 'hover:bg-accent',
    ]"
  >
    <div class="truncate" :class="isNewAndAnimating && 'animate-new'">
      {{ text }}
    </div>

    <Button variant="ghost" size="icon" class="w-6 h-6" @mousedown.stop @click.stop="emit('close')">
      <XIcon class="duration-[0] text-muted-foreground" />
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { XIcon } from 'lucide-vue-next';

import { computed, type PropType } from 'vue';
import { useMainStore } from '~/composables/stores/useMainStore';
import type { ITabEntry } from '~/composables/stores/useTabsStoreV2';

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
    type: Object as PropType<ITabEntry>,
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

  const opened = props.item.history[props.item.historyPointer]!;

  if (opened._type === 'folder') {
    if (opened._path === rootPath.data.value || !opened._path.length) {
      return 'All Books';
    }
    return opened._path.replace(rootPath.data.value, '').replace(/[\\/]/, '');
  }

  if (opened._type === 'file') {
    return opened._path.split(/[\\/]/).pop();
  }

  return opened._type;
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
