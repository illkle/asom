<template>
  <BreadcrumbList class="">
    <template v-for="(item, i) in breadcrumbItems.start">
      <BreadcrumbSeparator v-if="i > 0" />
      <BreadcrumbItem
        v-if="item"
        :class="getItemClass(item)"
        @click="!isLastItem(item) && ts.openNewThingFast({ _type: 'folder', _path: item.path })"
      >
        {{ item.label }}
      </BreadcrumbItem>
    </template>
    <template v-if="breadcrumbItems.middle.length > 0 || breadcrumbItems.end.length > 0">
      <BreadcrumbSeparator />

      <DropdownMenu>
        <DropdownMenuTrigger class="flex items-center gap-1">
          <BreadcrumbEllipsis class="h-4 w-4" />
          <span class="sr-only">Toggle menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            v-for="item in breadcrumbItems.middle"
            :key="item.path"
            @click="ts.openNewThingFast({ _type: 'folder', _path: item.path })"
          >
            {{ item.label }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
    <template v-for="(item, i) in breadcrumbItems.end">
      <BreadcrumbSeparator v-if="i > 0 || breadcrumbItems.middle.length > 0" />

      <BreadcrumbItem
        v-if="item"
        :class="getItemClass(item)"
        @click="!isLastItem(item) && ts.openNewThingFast({ _type: 'folder', _path: item.path })"
      >
        {{ item.label }}
      </BreadcrumbItem>
    </template>
  </BreadcrumbList>
</template>

<script setup lang="ts">
import { useTabsStoreV2 } from '~/composables/stores/useTabsStoreV2';
import type { FileBreadCrumbs } from '~/types';
import type { BreadcrumbItem } from '~~/src-tauri/bindings/BreadcrumbItem';

const props = defineProps<{
  breadcrumbItems: FileBreadCrumbs;
}>();

const ts = useTabsStoreV2();

const lastItem = computed(() => {
  if (props.breadcrumbItems.end.length === 0) {
    return props.breadcrumbItems.start[props.breadcrumbItems.start.length - 1];
  }

  return props.breadcrumbItems.end[props.breadcrumbItems.end.length - 1];
});

const isLastItem = (item: BreadcrumbItem) => {
  return item.path === lastItem.value?.path;
};

const getItemClass = (item: BreadcrumbItem): string[] => {
  return [
    isLastItem(item) ? 'cursor-default' : 'cursor-pointer',
    'w-fit block whitespace-nowrap truncate block shrink max-w-64',
  ];
};
</script>
