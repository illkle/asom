import { cva } from 'cva';

export const textInputVariants = cva({
  base: '',
  variants: {
    theme: {
      Default: '',
      Hidden: 'bg-transparent border-transparent dark:bg-transparent dark:border-transparent ',
    },
    size: {
      L: 'text-4xl md:text-4xl h-auto flex',
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

export const numberInputVariants = cva({
  base: [
    'text-foreground inline-flex items-center font-mono ',
    'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30',
    'shadow-xs transition-[color,box-shadow] outline-none',
  ],
  variants: {
    size: {
      L: 'text-xl h-10',
      M: '',
      S: 'text-xs h-6 rounded-sm ',
    },
  },
  defaultVariants: {
    size: 'M',
  },
});
export const textCollectionInputVariants = cva({
  base: [
    'text-foreground inline-flex items-center  transition-all',
    'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground  border  flex   outline-none   ',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ',
    'data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 ',
  ],
  variants: {
    size: {
      L: 'text-xl px-1.5 py-0.5 rounded-md ',
      M: 'text-sm rounded-md px-1.5 py-0.5 ',
      S: 'text-xs h-fit px-1.5 py-0.5 rounded-sm ',
    },
    font: {
      Serif: 'font-serif',
      Sans: '',
    },
    mode: {
      Default:
        'border-input font-semibold bg-transparent dark:bg-input/30  shadow-xs transition-[color,box-shadow]',
      Title: 'border-transparent mr-1',
    },
  },
  defaultVariants: {
    size: 'S',
    font: 'Sans',
    mode: 'Default',
  },
});
