import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Service, type IService } from './service.model.js';
import type { HydratedDocument } from 'mongoose';

function toPublicService(service: HydratedDocument<IService>) {
  return {
    id: service._id,
    name: service.name,
    description: service.description,
    price: service.price,
    category: service.category,
    isActive: service.isActive,
    createdAt: service.createdAt,
  };
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function listServices(req: Request, res: Response) {
  const canSeeInactive = req.user && ['staff', 'admin'].includes(req.user.role);
  const filter = canSeeInactive ? {} : { isActive: true };
  const services = await Service.find(filter).sort({ createdAt: -1 });

  return res.status(200).json({ services: services.map(toPublicService) });
}

export async function createService(req: Request, res: Response) {
  const { name, description, price, category } = req.body;

  if (!name || typeof price !== 'number' || price < 0) {
    return res
      .status(400)
      .json({ error: 'Name and a non-negative price are required.' });
  }

  const service = await Service.create({ name, description, price, category });

  return res.status(201).json({ service: toPublicService(service) });
}

export async function updateService(req: Request, res: Response) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid service id.' });
  }

  const { name, description, price, category, isActive } = req.body;

  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    return res
      .status(400)
      .json({ error: 'Price must be a non-negative number.' });
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be true or false.' });
  }

  const updates: Partial<IService> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = price;
  if (category !== undefined) updates.category = category;
  if (isActive !== undefined) updates.isActive = isActive;

  const service = await Service.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!service) {
    return res.status(404).json({ error: 'Service not found.' });
  }

  return res.status(200).json({ service: toPublicService(service) });
}
