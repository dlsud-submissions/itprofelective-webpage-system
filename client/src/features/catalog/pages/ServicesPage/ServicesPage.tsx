import { CatalogPage } from '../../components/CatalogPage/CatalogPage';
import {
  createService,
  listServices,
  updateService,
} from '../../api/services.api';

export function ServicesPage() {
  return (
    <CatalogPage
      title="Our Services"
      subtitle="Grooming, veterinary, and other services offered at Golden Fur."
      itemNoun="service"
      extraField={{ key: 'category', label: 'Category', type: 'text' }}
      listItems={listServices}
      createItem={createService}
      updateItem={updateService}
    />
  );
}
