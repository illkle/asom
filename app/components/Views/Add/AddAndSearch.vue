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
            :placeholder="hasApi ? 'Filename or API search' : 'Filename'"
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
          v-if="hasApi && apiConnection.q.data.value && selectedSchema"
          :search="mainInputValue"
          :schema="selectedSchema"
          :connection="apiConnection.q.data.value"
          class="max-h-[300px] overflow-y-auto mt-2"
          @select="(data) => emit('handleAddFromApi', data)"
        />

        <DialogDescription></DialogDescription>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import type { ApiSettings } from '~/components/Api/apis';
import ApiSearchRouter from '~/components/Api/ApiSearchRouter.vue';
import { provideResultGenericWrapper } from '~/components/Api/common/resultGeneric';
import type { APIEmitData } from '~/components/Api/makeFileFromApi';
import KeyboardListItem from '~/components/Modules/KeyboardList/KeyboardListItem.vue';
import { useKeyboardListManager } from '~/components/Modules/KeyboardList/useKeyboardListManager';
import type { Schema } from '~/types';

const props = defineProps<{
  selectedSchema: Schema;
  selectedSchemaPath: string;
}>();

const emit = defineEmits<{
  (e: 'handleAddFromApi', data: APIEmitData<ApiSettings>): void;
  (e: 'handleAddEmpty', inputValue: string): void;
}>();

const modalOpened = defineModel<boolean>('opened');

const apiConnection = useApiConnection(computed(() => props.selectedSchemaPath));

const mainInputValue = ref('');

const wrapperRef = useTemplateRef('wrapperRef');

const kb = useKeyboardListManager(wrapperRef);

provideResultGenericWrapper(KeyboardListItem);

const isMac = useIsMac();

const hasApi = computed(() => {
  return apiConnection.q.data.value && apiConnection.q.data.value.type !== 'none';
});
</script>
