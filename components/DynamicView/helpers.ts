import z from 'zod';

export const zDynamicViewGroup = z.interface({
  name: z.string(),
  style: z.interface({
    direction: z.enum(['row', 'column']).default('row'),
    gap: z.number().default(0),
    align: z.enum(['start', 'center', 'end']).default('start'),
    justify: z
      .enum(['start', 'center', 'end', 'between', 'around', 'evenly'])
      .optional()
      .default('start'),
  }),
  get subcategories() {
    return z.array(zDynamicViewGroup.or(z.string()));
  },
});

export type IDynamicViewGroup = z.infer<typeof zDynamicViewGroup>;
