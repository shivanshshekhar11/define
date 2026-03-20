import { eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm'
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core'

interface CrudDb {
  insert: (table: AnyPgTable) => {
    values: (input: unknown) => {
      returning: () => Promise<unknown[]>
    }
  }
  select: () => {
    from: (table: AnyPgTable) => Promise<unknown[]> & {
      where: (condition: unknown) => Promise<unknown[]>
    }
  }
  update: (table: AnyPgTable) => {
    set: (patch: unknown) => {
      where: (condition: unknown) => {
        returning: () => Promise<unknown[]>
      }
    }
  }
}

export interface CreateRepositoryOptions<
  TTable extends AnyPgTable,
  TPrimaryColumn extends AnyPgColumn,
> {
  db: CrudDb
  table: TTable
  primaryKey: TPrimaryColumn
}

export const createRepository = <
  TTable extends AnyPgTable,
  TPrimaryColumn extends AnyPgColumn,
>({
  db,
  table,
  primaryKey,
}: CreateRepositoryOptions<TTable, TPrimaryColumn>) => {
  type Row = InferSelectModel<TTable>
  type Insert = InferInsertModel<TTable>
  type Update = Partial<Insert>
  type Primary = InferSelectModel<TTable>[Extract<keyof Row, string>]

  return {
    insert: async (input: Insert): Promise<Row> => {
      const [row] = await db.insert(table).values(input).returning()
      return row as Row
    },

    findById: async (id: Primary): Promise<Row | null> => {
      const [row] = await db.select().from(table).where(eq(primaryKey, id))
      return (row as Row | undefined) ?? null
    },

    findMany: async (): Promise<Row[]> => {
      const rows = await db.select().from(table)
      return rows as Row[]
    },

    updateById: async (id: Primary, patch: Update): Promise<Row | null> => {
      const [row] = await db.update(table).set(patch).where(eq(primaryKey, id)).returning()
      return (row as Row | undefined) ?? null
    },
  }
}
