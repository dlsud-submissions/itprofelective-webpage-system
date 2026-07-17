import { CatalogPage } from '../../shared/catalog/components/CatalogPage/CatalogPage';
import { createProduct, listProducts, updateProduct } from '../../shared/catalog/api/products.api';

export function ProductsPage() {
  return (
    <CatalogPage
      title="Our Products"
      subtitle="Shop supplies and essentials available at Golden Fur."
      itemNoun="product"
      extraField={{ key: 'stock', label: 'Stock', type: 'number', min: 0 }}
      listItems={listProducts}
      createItem={createProduct}
      updateItem={updateProduct}
    />
  );
}
