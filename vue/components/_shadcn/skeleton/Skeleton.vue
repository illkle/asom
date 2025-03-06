<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '~/utils/sh'

interface SkeletonProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<SkeletonProps>()
</script>

<template>
  <div :class="cn('animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800', props.class)" />
</template>
