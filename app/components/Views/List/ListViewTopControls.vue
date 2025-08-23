<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" class="ml-auto">
        Columns <ChevronDown class="ml-2 h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="orderDialogOpened = true">
        <ListOrdered :size="16" /> Reorder
      </DropdownMenuItem>
      <DropdownMenuSeparator />

      <DropdownMenuCheckboxItem
        v-for="column in props.columns"
        :key="column.id"
        class="capitalize"
        :model-value="column.getIsVisible()"
        @update:model-value="column.toggleVisibility()"
      >
        {{ column.columnDef.header }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <!-- Column ordering dialog -->
  <Dialog v-model:open="orderDialogOpened">
    <DialogContent>
      <DialogTitle>Sort Columns</DialogTitle>
      <DialogDescription> </DialogDescription>
      <SimpleDNDList
        :initial-items="itemsForOrdering"
        @order-change="
          (update) => {
            // @ts-ignore vue is being dumb for some reason
            const mapped = update.map((v) => v.id);
            emit('updateOrder', mapped);

            orderDialogOpened = false;
          }
        "
      />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { Column } from '@tanstack/vue-table';
import { ChevronDown, ListOrdered } from 'lucide-vue-next';
import SimpleDNDList from '~/components/Views/List/SimpleDNDList.vue';
import type { RecordFromDb } from '~/types';

const props = defineProps<{
  columns: Column<RecordFromDb, any>[];
}>();

const emit = defineEmits<{
  (e: 'updateOrder', update: string[]): void;
}>();

/** Column ordering  */

const orderDialogOpened = ref(false);

const itemsForOrdering = computed(() => {
  return props.columns
    .map((v) => ({
      index: v.getIndex(),
      id: v.id,
      name: v.columnDef.header.toString(),
      type: (v.columnDef.meta as { type: string }).type,
      isVisible: v.getIsVisible(),
    }))
    .sort((a, b) => a.index - b.index);
});
</script>
