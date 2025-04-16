import { cva } from 'cva';

export const extraInputVariants = cva({
  base: '',
  variants: {
    theme: {
      Default: '',
      Hidden: 'bg-transparent border-transparent dark:bg-transparent dark:border-transparent ',
    },
    size: {
      L: 'text-4xl md:text-4xl h-auto',
      M: 'text-xl md:text-xl h-auto',
      S: 'text-xs h-fit',
    },
    font: {
      Serif: 'font-serif',
      Sans: '',
    },
    weight: {
      Light: 'font-light',
      Normal: 'font-normal',
      Bold: 'font-bold',
      Black: 'font-black',
    },
  },
  defaultVariants: {
    theme: 'Default',
    size: 'S',
    font: 'Sans',
  },
});
