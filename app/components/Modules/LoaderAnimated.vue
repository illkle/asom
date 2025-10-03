<script setup lang="ts">
const props = defineProps({
  size: {
    type: String as PropType<'md' | 'lg'>,
    default: 'md',
  },
});

const letters = ['a', 's', 'o', 'm'];

const num = computed(() => {
  return props.size === 'lg' ? letters.length * 3 : letters.length * 2;
});

const getLetter = (index: number) => {
  return letters[index % letters.length];
};
</script>

<template>
  <div class="w-full flex justify-center font-mono text-primary">
    <div
      class="endlessRotation origin-center opacityAnimation"
      :class="{
        'h-24 w-24': props.size === 'lg',
        'h-14 w-14': props.size === 'md',
      }"
    >
      <div
        v-for="i in num"
        :key="i"
        class="absolute font-black origin-bottom-left left-[50%] letter"
        :class="{
          'h-12 text-2xl': props.size === 'lg',
          'h-7 text-regular': props.size === 'md',
        }"
        :style="{ transform: `rotateZ(${(360 / num) * (i + 1)}deg)` }"
      >
        {{ getLetter(i - 1) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.endlessRotation {
  animation: rotation 4s infinite linear;
}

@keyframes pulsing {
  0% {
    opacity: 0.1;
  }
  100% {
    opacity: 1;
  }
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}
</style>
