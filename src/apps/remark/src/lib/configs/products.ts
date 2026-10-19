const PRODUCTS = {
  PLUS: 'plus',
  PRO: 'pro',
} as const;

export type Product = (typeof PRODUCTS)[keyof typeof PRODUCTS];

const PRODUCT_CONFIGS = {
  [PRODUCTS.PLUS]: {
    productId: 'plus',
    slug: PRODUCTS.PLUS,
  },
  [PRODUCTS.PRO]: {
    productId: 'pro',
    slug: PRODUCTS.PRO,
  },
} as const;

export const getSlugFromProductId = (productId: string): Product => {
  const product = Object.entries(PRODUCT_CONFIGS).find(
    ([, config]) => config.productId === productId,
  )?.[0];

  return product as Product;
};
