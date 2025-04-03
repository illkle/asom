export type SettingsOptions<T> = {
  [K in keyof T]?: T[K][];
};
