import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import {
  Purchase,
  PURCHASE_ITEM_TYPES,
  type IPurchase,
  type PurchaseItemType,
} from './purchase.model.js';
import { Product } from '../products/product.model.js';
import { Service } from '../services/service.model.js';

function toPublicPurchase(purchase: HydratedDocument<IPurchase>) {
  return {
    id: purchase._id,
    itemType: purchase.itemType,
    itemId: purchase.itemId,
    itemName: purchase.itemName,
    unitPrice: purchase.unitPrice,
    quantity: purchase.quantity,
    totalPrice: purchase.totalPrice,
    createdAt: purchase.createdAt,
  };
}

export async function listMyPurchases(req: Request, res: Response) {
  const purchases = await Purchase.find({ userId: req.user!._id }).sort({
    createdAt: -1,
  });

  return res.status(200).json({ purchases: purchases.map(toPublicPurchase) });
}

export async function createPurchase(req: Request, res: Response) {
  const { itemType, itemId, quantity } = req.body as {
    itemType?: PurchaseItemType;
    itemId?: string;
    quantity?: number;
  };

  if (!itemType || !PURCHASE_ITEM_TYPES.includes(itemType)) {
    return res
      .status(400)
      .json({ error: 'itemType must be "product" or "service".' });
  }

  if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
    return res.status(400).json({ error: 'A valid itemId is required.' });
  }

  const qty = quantity === undefined ? 1 : quantity;
  if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1) {
    return res
      .status(400)
      .json({ error: 'Quantity must be a positive whole number.' });
  }

  let itemName: string;
  let unitPrice: number;

  if (itemType === 'product') {
    // Atomically decrement stock only when enough is available, so two
    // concurrent purchases can never oversell the same units.
    const product = await Product.findOneAndUpdate(
      { _id: itemId, isActive: true, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { new: true }
    );

    if (!product) {
      const exists = await Product.findOne({ _id: itemId, isActive: true });
      if (!exists) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      return res.status(409).json({
        error: `Not enough stock. Only ${exists.stock} left.`,
      });
    }

    itemName = product.name;
    unitPrice = product.price;
  } else {
    const service = await Service.findOne({ _id: itemId, isActive: true });
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    itemName = service.name;
    unitPrice = service.price;
  }

  const purchase = await Purchase.create({
    userId: req.user!._id,
    itemType,
    itemId,
    itemName,
    unitPrice,
    quantity: qty,
    totalPrice: unitPrice * qty,
  });

  return res.status(201).json({ purchase: toPublicPurchase(purchase) });
}
