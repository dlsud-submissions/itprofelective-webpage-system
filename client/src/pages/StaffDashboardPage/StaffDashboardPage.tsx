import { DashboardPage } from '../../shared/dashboard/components/DashboardPage/DashboardPage';

export function StaffDashboardPage() {
  return (
    <DashboardPage
      title="Staff Dashboard"
      roleLabel="Staff"
      links={[
        {
          to: '/catalog/services',
          label: 'Manage Services',
          description: 'Add, edit, and deactivate services in the catalog.',
        },
        {
          to: '/catalog/products',
          label: 'Manage Products',
          description: 'Add, edit, and deactivate products in the catalog.',
        },
      ]}
    />
  );
}
