<template>
  <LayoutGroup>
    <AnimatePresence>
      <motion.div layout="position" :transition="{ duration: 0.4, ease: 'easeInOut' }" class="flex">
        <LoaderAnimated size="lg" />
      </motion.div>

      <motion.div
        v-if="query.data.value === null"
        layout="preserve-aspect"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :transition="{ opacity: { delay: 0.4, duration: 0.3, ease: 'easeIn' } }"
        class="flex flex-col justify-center p-4"
      >
        <div class="text-2xl font-serif">To begin please set root path</div>
        <div class="text-xs text-muted-foreground mt-1">
          Your files & settings will be saved there.
        </div>
        <Button class="mt-4" @click="pathMutation.mutate" variant="outline"> Set Root Path </Button>
      </motion.div>
      <template v-else-if="!query.isPending.value">
        <motion.div class="max-w-xs">
          <h2 class="text-2xl font-serif">Welcome</h2>
          <template v-if="defaultInitMutation.status.value !== 'success'">
            <p>Do you want to start with sample setup?</p>
            <Button class="mt-4 w-full" @click="defaultInitMutation.mutate">
              Setup books, movies and games folders
            </Button>
            <Button class="mt-4 w-full" variant="outline" @click="emits('unlockFromOnboarding')">
              Start from scratch
            </Button>
          </template>
        </motion.div>
      </template>
    </AnimatePresence>
  </LayoutGroup>
</template>

<script lang="ts" setup>
import { motion } from 'motion-v';
import { selectAndSetRootPath } from '~/api/rootPath';
import LoaderAnimated from '~/components/Modules/LoaderAnimated.vue';
import { appFlagsConfigDisk } from '~/composables/data/useAppGlags';

const props = defineProps<{
  query: ReturnType<typeof useRootPathFromQuery>;
}>();

const emits = defineEmits<{
  (e: 'lockForOnboarding'): void;
  (e: 'unlockFromOnboarding'): void;
}>();

watch(
  props.query.data,
  (data) => {
    if (data === null) {
      emits('lockForOnboarding');
    }
  },
  { immediate: true },
);

const pathMutation = useMutation({
  mutation: async () => {
    const setPath = await selectAndSetRootPath();
    if (!setPath) throw new Error('No root path was selected');
    return setPath;
  },
  onSuccess: async (rootPath) => {
    if (!rootPath) return;
    const appFlags = await appFlagsConfigDisk.get(rootPath);

    if (appFlags.introDone) {
      emits('unlockFromOnboarding');
    }
  },
});

const defaultInitMutation = useMutation({
  mutation: async () => {
    await createDefaultSchemas();
    if (!props.query.data.value) {
      throw new Error('No root path was selected');
    }
    appFlagsConfigDisk.set(props.query.data.value, { introDone: true });
    return true;
  },
});
</script>
