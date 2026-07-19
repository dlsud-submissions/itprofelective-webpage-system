import { DashboardPage } from '../../components/DashboardPage/DashboardPage';

export function AdminDashboardPage() {
  return (
    <DashboardPage
      title="Admin Dashboard"
      roleLabel="Admin"
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
      note="User management (ban/unban, role changes) is not wired up in this app yet."
    />
  );
}
