export type RenameProps<T, R extends Record<string, keyof T>> = {
  [P in keyof R as R[P] extends keyof T ? P : never]: R[P] extends keyof T ? T[R[P]] : never;
};
