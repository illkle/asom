<script setup lang="ts">
import { Reorder } from 'motion-v';
import { ref } from 'vue';

type IItem = { id: string; name: string; type: string; isVisible: boolean };

const props = defineProps<{
  initialItems: IItem[];
}>();

const emit = defineEmits<{
  (e: 'orderChange', items: IItem[]): void;
}>();

const internalList = ref<IItem[]>([]);

watch(
  props,
  (newProps) => {
    internalList.value = newProps.initialItems;
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <Reorder.Group
      :values="internalList"
      @update:values="(v) => (internalList = v)"
      class="flex flex-col gap-1 w-full"
    >
      <Reorder.Item
        v-for="element in internalList"
        :key="element.id"
        :value="element"
        class="border px-2 py-1 bg-background relative w-full rounded-md cursor-grab flex justify-between items-center"
        :class="{ 'opacity-50': !element.isVisible }"
      >
        <div class="flex flex-col">
          <span class="text-sm">
            {{ element.name ?? element.id }}
          </span>

          <span class="text-xs text-muted-foreground">
            {{ element.type }}
          </span>
        </div>

        <span v-if="!element.isVisible" class="text-xs text-muted-foreground">
          Currently hidden
        </span>
      </Reorder.Item>
    </Reorder.Group>

    <Button variant="outline" @click="() => emit('orderChange', internalList)">
      Change Order
    </Button>
  </div>
</template>
