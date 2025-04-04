<template>
  <div ref="containerDiv" class="relative flex flex-wrap items-center gap-1">
    <template v-for="(tag, index) in tags" :key="index">
      <ContentEditable
        ref="tagRefs"
        :model-value="tag"
        tag="div"
        spellcheck="false"
        :no-n-l="true"
        :class="[classes, prefix ? 'prefix before:pr-0.5 before:opacity-50' : '']"
        @keydown="(e: KeyboardEvent) => keyDownHandler(e, index)"
        @update:model-value="(val: string | Number) => saveTag(index, String(val))"
        @returned="createNewTag"
      />
    </template>
    <button :class="classes" @click="createNewTag">
      <PlusIcon class="w-4 fill-foreground pr-0.5 opacity-50 transition-colors" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { PlusIcon } from 'lucide-vue-next';
import { nextTick, ref } from 'vue';
import ContentEditable from '~/components/uiExtra/ContentEditable.vue';
import type { TextCollectionSettings } from '~/src-tauri/bindings/TextCollectionSettings';

const classes = [
  'text-foreground inline-flex h-6 items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-all',
  'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex rounded-sm border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none   ',
  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
];

const tags = defineModel<string[] | null>();

const props = defineProps<{
  settings: TextCollectionSettings | null;
}>();

const prefix = computed(() => (props.settings?.prefix ? `'${props.settings?.prefix}'` : undefined));

const saveTag = (index: number, tag: string) => {
  if (!tags.value) {
    tags.value = [tag];
  } else if (!tag) {
    tags.value.splice(index, 1);
  } else {
    tags.value[index] = tag;
  }

  if (!tag) {
    nextTick(() => {
      if (!tags.value || !tags.value.length) return;

      // When deleting first tag jump to second otherwise jump to previous
      const indexToSet = index === 0 ? 0 : index - 1;

      const targ = tagRefs.value[indexToSet].element;
      targ.focus();
      selectElement(targ);
    });
  }
};

const tagRefs = ref<{ element: HTMLElement }[]>([]);

const selectElement = (element: HTMLElement, place?: 'end' | 'start') => {
  console.log('selectElement', element);
  element.focus();
  const sel = window.getSelection();
  if (sel) {
    const range = document.createRange();

    if (place) {
      // We need to create range for text inside div, not div itself.
      // Otherwise selection.focusOffset(and anchorOfsset) will be 1 and we won't be able to jump to next tag immediatelly.
      // We have ::before on div, but it's not considered a child node therefore [0]
      const text = element.childNodes[0];
      console.log('text', text);
      if (!text) {
        // Shouldn't happen, but just in case
        console.error('Somethings is wrong when moving selection between tags');
      } else {
        if (place === 'end') {
          range.setStart(text, text.nodeValue?.length || 0);
          range.setEnd(text, text.nodeValue?.length || 0);
        } else {
          range.setStart(text, 0);
          range.setEnd(text, 0);
        }
      }
    } else {
      // This will select the whole tag
      range.selectNodeContents(element);
    }
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

const createNewTag = () => {
  saveTag(tags.value?.length || 0, `tag${(tags.value?.length || 0) + 1}`);

  // Focus and select all
  nextTick(() => {
    const lastTag = tagRefs.value[tagRefs.value.length - 1].element;
    if (lastTag) {
      selectElement(lastTag);
    }
  });
};

const keyDownHandler = (e: KeyboardEvent, index: number) => {
  if (!tags.value || !tags.value.length) return;
  const tagValue = tags.value[index];

  if (e.code !== 'ArrowRight' && e.code !== 'ArrowLeft') return;
  const dir = e.code === 'ArrowLeft' ? -1 : 1;
  const selection = window.getSelection();
  if (!selection) return;

  // If ArrowLeft pressed when cursor is at start of tag move to previous tag
  if (selection.focusOffset === 0 && dir === -1) {
    e.preventDefault();
    if (index === 0) return;
    const tag = tagRefs.value[index - 1].element;
    selectElement(tag, 'end');
    return;
  }

  if (selection.focusOffset >= tagValue.length && dir === 1) {
    e.preventDefault();
    if (index === tags.value.length - 1) return;
    const tag = tagRefs.value[index + 1].element;

    selectElement(tag, 'start');
    return;
  }
};
</script>

<style scoped>
.prefix::before {
  content: v-bind(prefix);
}
</style>
