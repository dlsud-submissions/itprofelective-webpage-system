import { DashboardPage } from '../../components/DashboardPage/DashboardPage';

export function CustomerDashboardPage() {
  return (
    <DashboardPage
      title="Your Dashboard"
      roleLabel="Customer"
      links={[
        {
          to: '/catalog/services',
          label: 'Browse Services',
          description:
            'See grooming, veterinary, and other services offered at Golden Fur.',
        },
        {
          to: '/catalog/products',
          label: 'Browse Products',
          description: 'Shop supplies and essentials available at Golden Fur.',
        },
      ]}
    />
  );
}
