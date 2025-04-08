const returnPassed = (thing: string) => {
  return thing || 'no thing';
};

export const useThing = (thing: string) => {
  const q = useQuery({
    key: () => [thing],
    query: async () => returnPassed(thing),
  });

  return {
    q,
  };
};

export const useObjectThing = (thing: { a: string }) => {
  const q = useQuery({
    key: () => [thing.a],
    query: async () => returnPassed(thing.a),
  });

  return {
    q,
  };
};
