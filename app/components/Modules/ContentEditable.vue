<template>
  <component
    :is="tag"
    ref="element"
    class="outline-none focus:outline-none"
    :class="isPlaceholder && placeholderClasses"
    :contenteditable="contenteditable"
    :data-disabled="disabled"
    @input="inputHandler"
    @focus="focusHandler"
    @blur="blurHandler"
    @paste="onPaste"
    @keypress="onKeypress"
  />
</template>

<script lang="ts" setup>
// Based on https://github.com/hl037/vue-contenteditable/blob/master/src/components/contenteditable.vue.d.ts
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { NUMBERS_REGEX } from '~/utils/index.ts';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  tag: {
    type: String,
    default: 'div',
  },
  contenteditable: {
    type: Boolean,
    default: true,
  },
  modelValue: {
    type: [String, Number],
    default: undefined,
  },
  noHTML: {
    type: Boolean,
    default: true,
  },
  noNL: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: 'Placeholder',
  },
  placeholderClasses: {
    type: String,
    default: '',
  },
  number: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'returned', val: string): void;
  (e: 'update:modelValue', val: string | number): void;
  (e: 'deleteZero'): void;
}>();

function replaceAll(str: string, search: string, replacement: string) {
  return str.split(search).join(replacement);
}

const element = ref<HTMLElement>();
defineExpose({ element });

const focused = ref();
const isPlaceholder = ref();

function currentContent() {
  if (!element.value) return '';
  return props.noHTML ? element.value.innerText : element.value.innerHTML;
}

function updateContent(newcontent: string | number | undefined, usePlaceholder: boolean) {
  if (!element.value) return;

  if (usePlaceholder && !newcontent) {
    element.value.innerHTML = props.placeholder;
    isPlaceholder.value = true;
  } else {
    isPlaceholder.value = false;

    if (typeof newcontent === 'number') {
      newcontent = Number.isNaN(newcontent) ? '' : String(newcontent);
    }

    if (props.noHTML) {
      element.value.innerText = newcontent || '';
    } else {
      element.value.innerHTML = newcontent || '';
    }
  }
}

function focusHandler() {
  focused.value = true;
  isPlaceholder.value = false;

  updateContent(props.modelValue, false);
}

function blurHandler() {
  focused.value = false;

  updateContent(props.modelValue, true);
}

const makeNumber = (input: string) => {
  return Number(input.replace(NUMBERS_REGEX, ''));
};

const removeNL = (text: string) => {
  text = replaceAll(text, '\r\n', '');
  text = replaceAll(text, '\n', '');
  text = replaceAll(text, '\r', '');
  return text;
};

function inputHandler() {
  let content = currentContent();

  if (props.noNL) {
    content = removeNL(content);
  }

  if (props.number) {
    emit('update:modelValue', makeNumber(content));
  } else {
    emit('update:modelValue', content);
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault();
  if (!event.clipboardData) return;
  let text = event.clipboardData.getData('text/plain');
  if (props.noNL) {
    text = removeNL(text);
  }
  window.document.execCommand('insertText', false, text);
}

function onKeypress(event: KeyboardEvent) {
  if (event.key == 'Enter' && props.noNL) {
    event.preventDefault();
    emit('returned', currentContent());
  }
  if (event.key === 'Backspace') {
    emit('deleteZero');
  }
}

onMounted(() => {
  updateContent(props.modelValue, true);
});

onBeforeUnmount(() => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
});

watch(
  () => props.modelValue,
  (newval) => {
    if (newval != currentContent()) {
      updateContent(newval, !focused.value);
    }
  },
);
</script>
