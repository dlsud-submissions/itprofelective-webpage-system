import {
  createCatalogItem,
  listCatalog,
  updateCatalogItem,
} from './catalogClient';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  [extra: string]: unknown;
}

export async function listProducts() {
  const result = await listCatalog<{ products: Product[] }>('products');
  if (result.error || !result.data) return { data: null, error: result.error };
  return { data: result.data.products, error: null };
}

export async function createProduct(payload: Record<string, unknown>) {
  const result = await createCatalogItem<{ product: Product }>(
    'products',
    payload
  );
  if (result.error || !result.data) return { data: null, error: result.error };
  return { data: result.data.product, error: null };
}

export async function updateProduct(
  id: string,
  payload: Record<string, unknown>
) {
  const result = await updateCatalogItem<{ product: Product }>(
    'products',
    id,
    payload
  );
  if (result.error || !result.data) return { data: null, error: result.error };
  return { data: result.data.product, error: null };
}
