export const focusInputOnDialogOpen = (e: Event) => {
  e.preventDefault();
  const t = e.target as HTMLInputElement;
  const a = t.querySelector(`input[autofocus]`);
  if (a) {
    (a as HTMLInputElement).focus();
  }
};
