<template>
  <motion.div
    layout
    class="flex justify-between items-center pl-2 w-full border-b absolute top-0 right-0 h-8 box-border"
  >
    <motion.div layout="preserve-aspect" class="text-xs text-muted-foreground"></motion.div>
    <motion.div layout="preserve-aspect" class="flex">
      <Button
        variant="outline"
        size="sm"
        class="rounded-none border-t-0 border-b-0"
        @click.stop="
          () => {
            emit('addItem');
          }
        "
        @pointerdown.stop
      >
        <SquarePlus />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            size="sm"
            variant="outline"
            class="rounded-none border-0 border-r-0 rounded-tr-md"
            @click.stop
            @pointerdown.stop
          >
            <CogIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <slot name="config" />
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  </motion.div>
</template>

<script setup lang="ts">
import { CogIcon, SquarePlus } from 'lucide-vue-next';
import { motion } from 'motion-v';

const emit = defineEmits<{
  (e: 'addItem'): void;
}>();
</script>
