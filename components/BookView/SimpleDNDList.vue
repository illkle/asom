<script setup lang="ts">
import { Reorder } from 'motion-v';
import { ref } from 'vue';

const props = defineProps<{
  initialItems: { id: string; label: string | undefined; isVisible: boolean }[];
}>();

const emit = defineEmits<{
  (e: 'update', items: { id: string; label: string | undefined; isVisible: boolean }[]): void;
}>();

const internalList = ref<{ id: string; label: string | undefined; isVisible: boolean }[]>([]);

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
        <span>
          {{ element.label ?? element.id }}
        </span>
        <span v-if="!element.isVisible" class="text-xs text-muted-foreground">
          Currently hidden
        </span>
      </Reorder.Item>
    </Reorder.Group>

    <Button variant="outline" @click="() => emit('update', internalList)"> Change Order </Button>
  </div>
</template>
