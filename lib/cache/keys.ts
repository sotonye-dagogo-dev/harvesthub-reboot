/** Cache key factories. All return UN-prefixed keys (helpers auto-prefix). */

export function productListKey(filterHash: string): string {
  return `cache:products:list:${filterHash}`;
}

export function productKey(id: string): string {
  return `cache:product:${id}`;
}

export function vendorKey(id: string): string {
  return `cache:vendor:${id}`;
}

export function vendorListKey(filterHash: string): string {
  return `cache:vendors:list:${filterHash}`;
}

export function bannerKey(): string {
  return 'cache:banners:active';
}

export function userWalletKey(userId: string): string {
  return `cache:user:${userId}:wallet`;
}

export function userProfileKey(userId: string): string {
  return `cache:user:${userId}:profile`;
}

export function publicContentKey(slug: string): string {
  return `cache:public-content:${slug}`;
}

export function publicContentListKey(): string {
  return 'cache:public-content:list';
}

export function blogPostKey(slug: string): string {
  return `cache:blog:post:${slug}`;
}

export function blogPostListKey(filterHash: string): string {
  return `cache:blog:posts:list:${filterHash}`;
}

export function blogConfigKey(): string {
  return 'cache:blog:config';
}
