// Placeholder DB client for generated repository imports.
export const db = {
  insert: <T>(_table: T) => ({
    values: <V>(_input: V) => ({
      returning: async () => [],
    }),
  }),
  select: () => ({
    from: <T>(_table: T) =>
      Object.assign(Promise.resolve([]), {
        where: async <W>(_condition: W) => [],
      }),
  }),
  update: <T>(_table: T) => ({
    set: <V>(_patch: V) => ({
      where: <W>(_condition: W) => ({
        returning: async () => [],
      }),
    }),
  }),
}
