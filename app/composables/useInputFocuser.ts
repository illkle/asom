/**
 * Assing retured ref to a hidden <Input> component it will autofocus when it appears
 */
export const useAppearingInputFocuser = (refName: string) => {
  // inputref is how ref is exposed by ui/Input.vue
  const ref = useTemplateRef<{ inputRef?: HTMLInputElement }>(refName);

  watchEffect(
    () => {
      if (ref.value) {
        console.log('focusing', ref.value.inputRef);
        ref.value.inputRef?.focus();
      }
    },
    { flush: 'post' },
  );

  return ref;
};
