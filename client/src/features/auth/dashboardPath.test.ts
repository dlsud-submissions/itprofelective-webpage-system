import { describe, expect, it } from 'vitest';
import { dashboardPathForRole } from './dashboardPath';

describe('dashboardPathForRole', () => {
  it('routes admins to the admin dashboard', () => {
    expect(dashboardPathForRole('admin')).toBe('/dashboard/admin');
  });

  it('routes staff to the staff dashboard', () => {
    expect(dashboardPathForRole('staff')).toBe('/dashboard/staff');
  });

  it('routes everyone else to the customer dashboard', () => {
    expect(dashboardPathForRole('user')).toBe('/dashboard/customer');
  });
});
