<template>
  <PageTemplate>
    {{ selectedItem }}

    <div ref="listRef" class="flex gap-2 flex-col">
      <KeyboardListItem>
        <Input
          v-model="input"
          autofocus
          @keydown.down="handleMove($event, 'onDown')"
          @keydown.up="handleMove($event, 'onUp')"
          @keydown.left="handleMove($event, 'onLeft')"
          @keydown.right="handleMove($event, 'onRight')"
        />
      </KeyboardListItem>

      <div class="flex gap-2 flex-col max-h-[300px] overflow-y-auto">
        <KeyboardListItem
          v-for="item in itm"
          :key="item.value"
          :item="item"
          class="p-2 bg-background focus-visible:bg-accent"
          tabindex="0"
        >
          {{ item.label }}
        </KeyboardListItem>
      </div>
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
const input = ref('Test');
import KeyboardListItem from '../Modules/KeyboardList/KeyboardListItem.vue';
import { useKeyboardListManager } from '../Modules/KeyboardList/useKeyboardListManager';
import PageTemplate from '../Views/Schema/common/PageTemplate.vue';

const radio = ref('option1');

const opts = ref([
  {
    label: 'Option 1',
    value: 'option1',
  },
  {
    label: 'Option 2',
    value: 'option2',
  },
  {
    label: 'Option 3',
    value: 'option3',
  },
]);

const itm = ref([
  {
    label: 'Item 1',
    value: 'item1',
  },
  {
    label: 'Item 2',
    value: 'item2',
  },
  {
    label: 'Item 3',
    value: 'item3',
  },
  {
    label: 'Item 4',
    value: 'item4',
  },
  {
    label: 'Item 5',
    value: 'item5',
  },
  {
    label: 'Item 6',
    value: 'item6',
  },
  {
    label: 'Item 7',
    value: 'item7',
  },
  {
    label: 'Item 8',
    value: 'item8',
  },
  {
    label: 'Item 9',
    value: 'item9',
  },
  {
    label: 'Item 10',
    value: 'item10',
  },
]);

const listRef = useTemplateRef('listRef');

const { handleMove, selectedItem, items } = useKeyboardListManager(listRef);
</script>
