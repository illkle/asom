const provideName = 'resultGenericWrapper';

export const provideResultGenericWrapper = (component: Component) => {
  provide(provideName, component);
};

export const useResultGenericWrapper = () => {
  return inject(provideName, () => undefined) as Component | undefined;
};
