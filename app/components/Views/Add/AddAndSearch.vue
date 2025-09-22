<template>
  <Dialog v-model:open="modalOpened" @update:open="mainInputValue = ''">
    <DialogTrigger class="w-full" as-child>
      <slot name="default" />
    </DialogTrigger>

    <DialogContent class="p-2 gap-0 top-[20vh] translate-y-0" hide-close>
      <DialogTitle></DialogTitle>
      <div ref="wrapperRef">
        <KeyboardListItem
          is-default
          class="data-[list-selected=true]:bg-transparent data-[list-selected=true]:border-ring data-[list-selected=true]:ring-ring/50 data-[list-selected=true]:ring-[3px] rounded-md"
        >
          <Input
            v-model:model-value="mainInputValue"
            placeholder="Filename or API search"
            autofocus
            class="focus-visible:ring-0"
            @keydown.down="kb.handleMove($event, 'onDown')"
            @keydown.up="kb.handleMove($event, 'onUp')"
            @keydown.left="kb.handleMove($event, 'onLeft')"
            @keydown.right="kb.handleMove($event, 'onRight')"
            @keydown.enter="
              () => {
                const res = kb.handleConfirm();

                if (!res) {
                  emit('handleAddEmpty', mainInputValue);
                }
              }
            "
          />
        </KeyboardListItem>

        <slot name="extra-controls" />

        <ApiSearchRouter
          v-if="
            apiConnection.q.data.value &&
            apiConnection.q.data.value.type !== 'none' &&
            selectedSchema
          "
          :search="mainInputValue"
          :schema="selectedSchema"
          :connection="apiConnection.q.data.value"
          class="max-h-[300px] overflow-y-auto mt-2"
          @select="(name, attrs) => emit('handleAddFromApi', name, attrs)"
        />

        <DialogDescription></DialogDescription>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import ApiSearchRouter from '~/components/Api/ApiSearchRouter.vue';
import { provideResultGenericWrapper } from '~/components/Api/common/resultGeneric';
import KeyboardListItem from '~/components/Modules/KeyboardList/KeyboardListItem.vue';
import { useKeyboardListManager } from '~/components/Modules/KeyboardList/useKeyboardListManager';
import type { RecordFromDb, Schema } from '~/types';

const props = defineProps<{
  selectedSchema: Schema;
  selectedSchemaPath: string;
}>();

const emit = defineEmits<{
  (e: 'handleAddFromApi', name: string, attrs: RecordFromDb['attrs']): void;
  (e: 'handleAddEmpty', inputValue: string): void;
}>();

const modalOpened = defineModel<boolean>('opened');

const apiConnection = useApiConnection(computed(() => props.selectedSchemaPath));

const mainInputValue = ref('');

const wrapperRef = useTemplateRef('wrapperRef');

const kb = useKeyboardListManager(wrapperRef);

provideResultGenericWrapper(KeyboardListItem);

const isMac = useIsMac();
</script>
