<template>
  <div
    :class="[
      'flex h-10 items-center justify-between border-transparent py-1 ',
      widthAwailable > 100 ? 'px-2 text-sm' : 'px-1 text-xs',
      isActive ? 'rounded-tl-md rounded-tr-md bg-background' : 'hover:bg-accent',
    ]"
  >
    <div class="flex items-center gap-1 truncate text-xs">
      <div class="shrink-0 opacity-50">
        <FolderIcon v-if="type === 'folder'" :size="12" />
        <FileIcon v-if="type === 'file'" :size="12" />
        <SettingsIcon v-if="type === 'settings'" :size="12" />
      </div>

      {{ opened?._tabTitle ?? '' }}
    </div>

    <Button variant="ghost" size="icon" class="w-6 h-6" @mousedown.stop @click.stop="emit('close')">
      <XIcon class="duration-[0] text-muted-foreground" />
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { FileIcon, FolderIcon, SettingsIcon, XIcon } from 'lucide-vue-next';

import { computed, type PropType } from 'vue';
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

const opened = computed(() => {
  if (!props.item) return null;
  return props.item.history[props.item.historyPointer]!;
});

const label = computed(() => {
  if (!opened.value) return null;
});

const type = computed(() => {
  if (!opened.value) return null;
  if (opened.value._type === 'folder') {
    return 'folder';
  }

  if (opened.value._type === 'file') {
    return 'file';
  }

  if (opened.value._type.startsWith('settings')) {
    return 'settings';
  }

  return null;
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
