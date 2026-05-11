import type {
  CartItem,
  Product,
  ProductListItem,
  ProductVariation,
} from "@favcrm/sdk";
import { getEffectivePrice } from "@favcrm/sdk";
import { derived, get, writable } from "svelte/store";
import { browser } from "$app/environment";

export type StorefrontCartItem = CartItem;

type CartProduct = ProductListItem | Product;

export interface AddToCartOptions {
  quantity?: number;
  variation?: ProductVariation;
}

export type AddResult =
  | { ok: true }
  | { ok: false; reason: "out_of_stock" | "stock_capped"; available: number };

const STORAGE_KEY = "favcrm.cart.v1";

function lineKey(productId: number, variationId?: number): string {
  return variationId ? `${productId}:${variationId}` : `${productId}`;
}

function pickImage(product: CartProduct): string | null {
  if ("image" in product) return product.image ?? null;
  if (!Array.isArray(product.images) || product.images.length === 0) {
    return null;
  }
  return (
    product.images.find((img) => img.isPrimary)?.src ??
    product.images[0]?.src ??
    null
  );
}

function toCartProduct(
  product: CartProduct,
  unitPrice: number,
): ProductListItem {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    slug: product.slug,
    price: unitPrice,
    discountPrice: product.discountPrice,
    memberPrice: product.memberPrice,
    seoTitle: product.seoTitle,
    status: product.status,
    productType: product.productType,
    stockStatus: product.stockStatus,
    categoryName:
      "categoryName" in product
        ? product.categoryName
        : null,
    categories: [],
    categorySlug: null,
    isVariable: false,
    image: "image" in product ? product.image : null,
    isFeatured: false,
  };
}

function availableStock(
  product: CartProduct,
  variation?: ProductVariation,
): number | null {
  const source = variation ?? product;
  if (source.stockStatus === "out_of_stock") return 0;
  if ("stockQuantity" in source && typeof source.stockQuantity === "number") {
    return source.stockQuantity;
  }
  return null;
}

function loadInitial(): StorefrontCartItem[] {
  if (!browser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StorefrontCartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.product &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function itemKey(item: StorefrontCartItem): string {
  return lineKey(item.product.id, item.variationId);
}

function createCartStore() {
  const internal = writable<StorefrontCartItem[]>(loadInitial());

  function persist(items: StorefrontCartItem[]) {
    if (!browser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota / privacy errors
    }
  }

  function mutate(fn: (items: StorefrontCartItem[]) => StorefrontCartItem[]) {
    internal.update((items) => {
      const next = fn(items);
      persist(next);
      return next;
    });
  }

  return {
    subscribe: internal.subscribe,
    add(product: CartProduct, options: AddToCartOptions = {}): AddResult {
      const { quantity = 1, variation } = options;
      const stock = availableStock(product, variation);
      if (stock === 0) {
        return { ok: false, reason: "out_of_stock", available: 0 };
      }

      const key = lineKey(product.id, variation?.id);
      const existing = get(internal).find((item) => itemKey(item) === key);
      const existingQty = existing?.quantity ?? 0;
      const requested = existingQty + quantity;
      const capped = stock !== null && requested > stock;
      const finalQty = capped ? stock : requested;

      if (finalQty === existingQty) {
        return { ok: false, reason: "stock_capped", available: stock ?? 0 };
      }

      const unitPrice = variation?.price ?? getEffectivePrice(product);

      mutate((current) => {
        if (existing) {
          return current.map((item) =>
            itemKey(item) === key ? { ...item, quantity: finalQty } : item,
          );
        }
        return [
          ...current,
          {
            product: toCartProduct(product, unitPrice),
            quantity: finalQty,
            variationId: variation?.id,
            variationName: variation?.name,
          },
        ];
      });

      if (capped) {
        return { ok: false, reason: "stock_capped", available: stock ?? 0 };
      }
      return { ok: true };
    },
    setQuantity(key: string, quantity: number) {
      mutate((items) => {
        if (quantity <= 0) {
          return items.filter((item) => itemKey(item) !== key);
        }
        return items.map((item) =>
          itemKey(item) === key ? { ...item, quantity } : item,
        );
      });
    },
    remove(key: string): StorefrontCartItem | null {
      const removed =
        get(internal).find((item) => itemKey(item) === key) ?? null;
      if (!removed) return null;
      mutate((current) => current.filter((item) => itemKey(item) !== key));
      return removed;
    },
    restore(item: StorefrontCartItem) {
      const key = itemKey(item);
      mutate((current) => {
        if (current.some((existing) => itemKey(existing) === key)) {
          return current;
        }
        return [...current, item];
      });
    },
    clear() {
      mutate(() => []);
    },
  };
}

export const cart = createCartStore();

export function cartLineKey(item: StorefrontCartItem): string {
  return lineKey(item.product.id, item.variationId);
}

export const cartCount = derived(cart, ($items) =>
  $items.reduce((sum, item) => sum + item.quantity, 0),
);

export const cartSubtotal = derived(cart, ($items) =>
  $items.reduce(
    (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
    0,
  ),
);
