import type { Product, ProductListItem } from "@favcrm/sdk";

export type StorefrontProduct = Product | ProductListItem;

export function productImage(product: StorefrontProduct): string | null {
  if ("image" in product) return product.image ?? null;
  const images = (product as Product).images;
  if (!Array.isArray(images) || images.length === 0) return null;
  return images.find((image) => image.isPrimary)?.src ?? images[0]?.src ?? null;
}

export function productPrice(product: StorefrontProduct): number | null {
  if ("salePrice" in product && product.salePrice != null)
    return product.salePrice;
  if (product.discountPrice != null) return product.discountPrice;
  return product.price;
}

export function productHref(product: StorefrontProduct): string {
  return product.slug ? `/shop/${product.slug}` : `/shop`;
}
