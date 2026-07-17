import { createCatalogItem, listCatalog, updateCatalogItem } from './catalogClient';

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
  [extra: string]: unknown;
}

export async function listServices() {
  const result = await listCatalog<{ services: Service[] }>('services');
  if (result.error || !result.data) return { data: null, error: result.error };
  return { data: result.data.services, error: null };
}

export async function createService(payload: Record<string, unknown>) {
  const result = await createCatalogItem<{ service: Service }>('services', payload);
  if (result.error || !result.data) return { data: null, error: result.error };
  return { data: result.data.service, error: null };
}

export async function updateService(id: string, payload: Record<string, unknown>) {
  const result = await updateCatalogItem<{ service: Service }>('services', id, payload);
  if (result.error || !result.data) return { data: null, error: result.error };
  return { data: result.data.service, error: null };
}
