import { For, Show } from 'solid-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '~/components/ui/dialog';
import { globalStore } from '~/utils/globalStore';

const ErrorModal = () => {
  const err = globalStore.errorDetailsModal;

  return (
    <Dialog open={!!err}>
      <Show when={err}>
        {(err) => (
          <DialogContent>
            <DialogTitle>{err().title}</DialogTitle>
            <DialogDescription>{err().info}</DialogDescription>

            <Show when={err().rawError}>
              <div>{err().rawError}</div>
            </Show>

            <Show when={err().subErrors}>
              {(subErrors) => (
                <For each={subErrors()}>
                  {(se) => {
                    return (
                      <>
                        <div class="bold ">{se.title}</div>
                        <div class="bold">{se.rawError}</div>
                      </>
                    );
                  }}
                </For>
              )}
            </Show>
          </DialogContent>
        )}
      </Show>
    </Dialog>
  );
};

export default ErrorModal;
