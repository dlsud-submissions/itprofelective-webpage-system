import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { requireStaffOrAdmin } from './requireStaffOrAdmin.js';

function mockRes() {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('requireStaffOrAdmin', () => {
  it('rejects when there is no user on the request', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn();

    requireStaffOrAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a plain user', () => {
    const req = { user: { role: 'user' } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireStaffOrAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it.each(['staff', 'admin'])('allows a %s user through', (role) => {
    const req = { user: { role } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireStaffOrAdmin(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
