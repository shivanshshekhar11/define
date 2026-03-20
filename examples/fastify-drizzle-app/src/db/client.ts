// Placeholder DB client for generated repository imports.
export const db = {
  insert: () => ({
    values: () => ({
      returning: async () => [],
    }),
  }),
  select: () => ({
    from: () =>
      Object.assign(Promise.resolve([]), {
        where: async () => [],
      }),
  }),
  update: () => ({
    set: () => ({
      where: () => ({
        returning: async () => [],
      }),
    }),
  }),
}
