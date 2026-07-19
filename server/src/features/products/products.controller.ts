import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product, type IProduct } from './product.model.js';
import type { HydratedDocument } from 'mongoose';

function toPublicProduct(product: HydratedDocument<IProduct>) {
  return {
    id: product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    isActive: product.isActive,
    createdAt: product.createdAt,
  };
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function listProducts(req: Request, res: Response) {
  const canSeeInactive = req.user && ['staff', 'admin'].includes(req.user.role);
  const filter = canSeeInactive ? {} : { isActive: true };
  const products = await Product.find(filter).sort({ createdAt: -1 });

  return res.status(200).json({ products: products.map(toPublicProduct) });
}

export async function createProduct(req: Request, res: Response) {
  const { name, description, price, stock } = req.body;

  if (!name || typeof price !== 'number' || price < 0) {
    return res
      .status(400)
      .json({ error: 'Name and a non-negative price are required.' });
  }

  if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
    return res
      .status(400)
      .json({ error: 'Stock must be a non-negative number.' });
  }

  const product = await Product.create({ name, description, price, stock });

  return res.status(201).json({ product: toPublicProduct(product) });
}

export async function updateProduct(req: Request, res: Response) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid product id.' });
  }

  const { name, description, price, stock, isActive } = req.body;

  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    return res
      .status(400)
      .json({ error: 'Price must be a non-negative number.' });
  }

  if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
    return res
      .status(400)
      .json({ error: 'Stock must be a non-negative number.' });
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be true or false.' });
  }

  const updates: Partial<IProduct> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = price;
  if (stock !== undefined) updates.stock = stock;
  if (isActive !== undefined) updates.isActive = isActive;

  const product = await Product.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  return res.status(200).json({ product: toPublicProduct(product) });
}
