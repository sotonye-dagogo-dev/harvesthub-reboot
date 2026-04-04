type AsyncOrSync<T> = T | Promise<T>;

export interface CrudAdapter<
  TEntity,
  TCreate,
  TUpdate,
  TExtraArgs extends unknown[] = unknown[],
> {
  findById?: (id: string) => AsyncOrSync<TEntity | null | undefined>;
  findAll?: (...args: any[]) => AsyncOrSync<TEntity[]>;
  findByEmail?: (...args: any[]) => AsyncOrSync<TEntity | null | undefined>;
  findByRole?: (...args: any[]) => AsyncOrSync<TEntity[]>;
  findByUserId?: (...args: any[]) => AsyncOrSync<TEntity | null | undefined>;
  findByBuyerId?: (...args: any[]) => AsyncOrSync<TEntity | null | undefined>;
  findByWalletId?: (...args: any[]) => AsyncOrSync<TEntity[]>;
  findByProductId?: (...args: any[]) => AsyncOrSync<TEntity[]>;
  findByVendor?: (...args: any[]) => AsyncOrSync<TEntity[]>;
  findByVendorId?: (...args: any[]) => AsyncOrSync<TEntity[]>;
  getActive?: (...args: any[]) => AsyncOrSync<TEntity | null | undefined>;
  count?: (...args: any[]) => AsyncOrSync<number>;
  create: (data: TCreate, ...extraArgs: TExtraArgs) => AsyncOrSync<TEntity>;
  update: (id: string, data: TUpdate) => AsyncOrSync<TEntity | null>;
  delete: (id: string) => AsyncOrSync<boolean>;
  verifyPassword?: (...args: any[]) => AsyncOrSync<boolean>;
  updatePassword?: (...args: any[]) => AsyncOrSync<boolean>;
  clear?: (...args: any[]) => AsyncOrSync<TEntity | null>;
}
