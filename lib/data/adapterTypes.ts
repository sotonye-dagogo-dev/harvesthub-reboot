type AsyncOrSync<T> = T | Promise<T>;

export interface CrudAdapter<TEntity, TCreate, TUpdate> {
  [key: string]: unknown;
  findById?: (id: string) => AsyncOrSync<TEntity | null | undefined>;
  findAll?: (...args: unknown[]) => AsyncOrSync<TEntity[]>;
  create: (data: TCreate, ...extraArgs: any[]) => AsyncOrSync<TEntity>;
  update: (id: string, data: TUpdate) => AsyncOrSync<TEntity | null>;
  delete: (id: string) => AsyncOrSync<boolean>;
}
