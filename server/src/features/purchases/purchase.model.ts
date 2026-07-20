import { Schema, model, Types } from 'mongoose';

export const PURCHASE_ITEM_TYPES = ['product', 'service'] as const;
export type PurchaseItemType = (typeof PURCHASE_ITEM_TYPES)[number];

export interface IPurchase {
  userId: Types.ObjectId;
  itemType: PurchaseItemType;
  itemId: Types.ObjectId;
  // Name and unit price are snapshotted at purchase time so history stays
  // accurate even if the catalog item is later renamed, repriced, or deactivated.
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  createdAt: Date;
}

const purchaseSchema = new Schema<IPurchase>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemType: {
    type: String,
    enum: PURCHASE_ITEM_TYPES,
    required: true,
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

purchaseSchema.index({ userId: 1, createdAt: -1 });

export const Purchase = model<IPurchase>('Purchase', purchaseSchema);
