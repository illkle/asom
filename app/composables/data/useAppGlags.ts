import z from 'zod';

const zAppFlags = z.object({
  introDone: z.boolean().optional(),
});

export const appFlagsConfigDisk = new ConfigStoredInRootFolder(
  'appFlags.json',
  zAppFlags,
  {} as z.infer<typeof zAppFlags>,
);

const KEY = (root: string | null | undefined) => [...KEY_DEPENDENT_ON_ROOT(root), 'apiCredentials'];
