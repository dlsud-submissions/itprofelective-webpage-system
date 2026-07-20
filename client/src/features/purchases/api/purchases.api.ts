import {
  createCatalogItem,
  listCatalog,
} from '../../catalog/api/catalogClient';

export type PurchaseItemType = 'product' | 'service';

export interface Purchase {
  id: string;
  itemType: PurchaseItemType;
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  createdAt: string;
}

export interface CreatePurchaseInput {
  itemType: PurchaseItemType;
  itemId: string;
  quantity: number;
}

export async function listMyPurchases() {
  const result = await listCatalog<{ purchases: Purchase[] }>('purchases');
  if (result.error || !result.data) return { data: null, error: result.error };
  return { data: result.data.purchases, error: null };
}

export async function createPurchase(payload: CreatePurchaseInput) {
  const result = await createCatalogItem<{ purchase: Purchase }>(
    'purchases',
    payload
  );
  if (result.error || !result.data) return { data: null, error: result.error };
  return { data: result.data.purchase, error: null };
}
