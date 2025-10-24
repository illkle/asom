<template>
  <div
    v-if="tiptap"
    class="flex bg-background shadow-lg shadow-background z-20 items-center gap-1 flex-wrap border border-border p-2 rounded-lg"
  >
    <!-- Text Formatting -->
    <div class="flex items-center gap-1 border-r border-border pr-2">
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(toggleBold)"
        :class="{ 'bg-accent': tiptap.isActive('bold') }"
        title="Bold (Ctrl+B)"
      >
        <BoldIcon />
      </Button>
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(toggleItalic)"
        :class="{ 'bg-accent': tiptap.isActive('italic') }"
        title="Italic (Ctrl+I)"
      >
        <ItalicIcon />
      </Button>
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(toggleStrike)"
        :class="{ 'bg-accent': tiptap.isActive('strike') }"
        title="Strikethrough"
      >
        <StrikethroughIcon />
      </Button>
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(toggleCode)"
        :class="{ 'bg-accent': tiptap.isActive('code') }"
        title="Inline Code"
      >
        <CodeIcon />
      </Button>
    </div>

    <!-- Headings -->
    <div class="flex items-center gap-1 border-r border-border pr-2">
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(() => toggleHeading(1))"
        :class="{ 'bg-accent': tiptap.isActive('heading', { level: 1 }) }"
        title="Heading 1"
      >
        <Heading1 />
      </Button>
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(() => toggleHeading(2))"
        :class="{ 'bg-accent': tiptap.isActive('heading', { level: 2 }) }"
        title="Heading 2"
      >
        <Heading2 />
      </Button>
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(() => toggleHeading(3))"
        :class="{ 'bg-accent': tiptap.isActive('heading', { level: 3 }) }"
        title="Heading 3"
      >
        <Heading3 />
      </Button>
    </div>

    <!-- Lists -->
    <div class="flex items-center gap-1 border-r border-border pr-2">
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(toggleBulletList)"
        :class="{ 'bg-accent': tiptap.isActive('bulletList') }"
        title="Bullet List"
      >
        <ListIcon />
      </Button>
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(toggleOrderedList)"
        :class="{ 'bg-accent': tiptap.isActive('orderedList') }"
        title="Numbered List"
      >
        <ListOrderedIcon />
      </Button>
    </div>

    <!-- Blocks -->
    <div class="flex items-center gap-1 border-r border-border pr-2">
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(toggleBlockquote)"
        :class="{ 'bg-accent': tiptap.isActive('blockquote') }"
        title="Blockquote"
      >
        <QuoteIcon />
      </Button>
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(toggleCodeBlock)"
        :class="{ 'bg-accent': tiptap.isActive('codeBlock') }"
        title="Code Block"
      >
        <CodeSquare />
      </Button>
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(insertHorizontalRule)"
        title="Horizontal Rule"
      >
        <MinusIcon />
      </Button>
    </div>

    <!-- History -->
    <div class="flex items-center gap-1">
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(undo)"
        :disabled="!canUndo"
        title="Undo (Ctrl+Z)"
      >
        <Undo />
      </Button>
      <Button
        variant="toggle"
        size="sm"
        @click="runCommand(redo)"
        :disabled="!canRedo"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BoldIcon,
  CodeIcon,
  CodeSquare,
  Heading1,
  Heading2,
  Heading3,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  Redo,
  StrikethroughIcon,
  Undo,
} from 'lucide-vue-next';

const props = defineProps<{
  fileEditor: ReturnType<typeof useFileEditorV2>;
}>();

const tiptap = computed(() => props.fileEditor.tiptapEditor.value);

const runCommand = (command: () => void) => {
  try {
    command();
  } catch (error) {
    console.error(error);
  }
};

const toggleBold = () => tiptap.value?.chain().focus().toggleBold().run();
const toggleItalic = () => tiptap.value?.chain().focus().toggleItalic().run();
const toggleStrike = () => tiptap.value?.chain().focus().toggleStrike().run();
const toggleCode = () => tiptap.value?.chain().focus().toggleCode().run();

const toggleHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  tiptap.value?.chain().focus().toggleHeading({ level }).run();
};

const toggleBulletList = () => tiptap.value?.chain().focus().toggleBulletList().run();
const toggleOrderedList = () => tiptap.value?.chain().focus().toggleOrderedList().run();

const toggleBlockquote = () => tiptap.value?.chain().focus().toggleBlockquote().run();
const toggleCodeBlock = () => tiptap.value?.chain().focus().toggleCodeBlock().run();
const insertHorizontalRule = () => tiptap.value?.chain().focus().setHorizontalRule().run();

// History commands
const undo = () => tiptap.value?.chain().focus().undo().run();
const redo = () => tiptap.value?.chain().focus().redo().run();

const canUndo = computed(() => tiptap.value?.can().undo() ?? false);
const canRedo = computed(() => tiptap.value?.can().redo() ?? false);
</script>
