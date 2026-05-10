import type { CartItem, Product, ProductListItem } from "@favcrm/sdk";
import { getEffectivePrice } from "@favcrm/sdk";
import { writable } from "svelte/store";

export type StorefrontCartItem = CartItem;

type CartProduct = ProductListItem | Product;

function toCartProduct(product: CartProduct): ProductListItem {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    slug: product.slug,
    price: product.price,
    discountPrice: product.discountPrice,
    memberPrice: product.memberPrice,
    seoTitle: product.seoTitle,
    status: product.status,
    productType: product.productType,
    stockStatus: product.stockStatus,
    categoryName:
      "categoryName" in product
        ? product.categoryName
        : (product.categories[0]?.name ?? null),
    categorySlug:
      "categorySlug" in product
        ? product.categorySlug
        : (product.categories[0]?.slug ?? null),
    categories: product.categories,
    isVariable: product.isVariable,
    image:
      "image" in product ? product.image : (product.images[0]?.src ?? null),
  };
}

function createCartStore() {
  const { subscribe, set, update } = writable<StorefrontCartItem[]>([]);

  return {
    subscribe,
    add(product: CartProduct, quantity = 1) {
      const cartProduct = toCartProduct(product);
      update((items) => {
        const existing = items.find((item) => item.product.id === product.id);
        if (existing) {
          return items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }

        return [
          ...items,
          {
            product: {
              ...cartProduct,
              price: getEffectivePrice(cartProduct),
            },
            quantity,
          },
        ];
      });
    },
    remove(productId: number) {
      update((items) => items.filter((item) => item.product.id !== productId));
    },
    clear() {
      set([]);
    },
  };
}

export const cart = createCartStore();
