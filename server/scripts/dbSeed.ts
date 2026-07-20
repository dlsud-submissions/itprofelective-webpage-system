import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, type UserRole } from '../src/shared/models/user.model.js';
import { Service } from '../src/features/services/service.model.js';
import { Product } from '../src/features/products/product.model.js';
import { Purchase } from '../src/features/purchases/purchase.model.js';

dotenv.config({ path: path.join(import.meta.dirname, '..', '.env') });

const SALT_ROUNDS = 10;

const SAMPLE_SERVICES = [
  {
    name: 'Basic Bath & Brush',
    description: 'Bath, blow-dry, and brush-out for a clean, fresh coat.',
    price: 25,
    category: 'Grooming',
  },
  {
    name: 'Full Groom Package',
    description: 'Bath, trim, nail clipping, and ear cleaning.',
    price: 45,
    category: 'Grooming',
  },
  {
    name: 'Wellness Checkup',
    description: 'General health exam and vaccination review.',
    price: 35,
    category: 'Veterinary',
  },
];

const SAMPLE_PRODUCTS = [
  {
    name: 'Premium Dog Food (5kg)',
    description: 'Grain-free adult formula.',
    price: 32.5,
    stock: 20,
  },
  {
    name: 'Cat Litter (10L)',
    description: 'Clumping, low-dust formula.',
    price: 18,
    stock: 15,
  },
  {
    name: 'Dog Shampoo',
    description: 'Gentle oatmeal formula for sensitive skin.',
    price: 10,
    stock: 30,
  },
];

interface SeedUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

async function seedUser({ name, email, password, role }: SeedUserInput) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    if (existing.role !== role) {
      existing.role = role;
      existing.isBanned = false;
      await existing.save();
      console.log(
        `[db:seed] Promoted existing user to ${role}: ${normalizedEmail}`
      );
    } else {
      console.log(
        `[db:seed] ${role} account already exists: ${normalizedEmail}`
      );
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role,
    isBanned: false,
  });
  console.log(`[db:seed] Created ${role} account: ${normalizedEmail}`);
  console.log(`[db:seed] Password: ${password}`);
  return user;
}

async function seedServices() {
  for (const service of SAMPLE_SERVICES) {
    const existing = await Service.findOne({ name: service.name });
    if (existing) {
      console.log(`[db:seed] Service already exists: ${service.name}`);
      continue;
    }
    await Service.create(service);
    console.log(`[db:seed] Created service: ${service.name}`);
  }
}

async function seedProducts() {
  for (const product of SAMPLE_PRODUCTS) {
    const existing = await Product.findOne({ name: product.name });
    if (existing) {
      console.log(`[db:seed] Product already exists: ${product.name}`);
      continue;
    }
    await Product.create(product);
    console.log(`[db:seed] Created product: ${product.name}`);
  }
}

// Give the demo customer a small purchase history so the "My Purchases"
// page has data on a fresh database. Skipped once the customer has any
// purchases, so re-running the seed never duplicates rows.
async function seedPurchases(customerId: mongoose.Types.ObjectId) {
  const existingCount = await Purchase.countDocuments({ userId: customerId });
  if (existingCount > 0) {
    console.log(
      `[db:seed] Customer already has ${existingCount} purchase(s); skipping sample purchases.`
    );
    return;
  }

  const product = await Product.findOne({ name: SAMPLE_PRODUCTS[0].name });
  const service = await Service.findOne({ name: SAMPLE_SERVICES[0].name });

  const samplePurchases = [
    product && {
      userId: customerId,
      itemType: 'product',
      itemId: product._id,
      itemName: product.name,
      unitPrice: product.price,
      quantity: 2,
      totalPrice: product.price * 2,
    },
    service && {
      userId: customerId,
      itemType: 'service',
      itemId: service._id,
      itemName: service.name,
      unitPrice: service.price,
      quantity: 1,
      totalPrice: service.price,
    },
  ].filter((purchase) => purchase !== null);

  for (const purchase of samplePurchases) {
    await Purchase.create(purchase);
    console.log(
      `[db:seed] Created sample purchase: ${purchase.quantity}x ${purchase.itemName}`
    );
  }
}

async function seedDb() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      '[db:seed] MONGODB_URI is not set. Copy server/.env.example to server/.env and configure it.'
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`[db:seed] Connected to MongoDB (${mongoose.connection.name})`);

  await seedUser({
    name: process.env.SEED_ADMIN_NAME || 'Golden Fur Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@goldenfur.local',
    password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
    role: 'admin',
  });

  await seedUser({
    name: process.env.SEED_STAFF_NAME || 'Golden Fur Staff',
    email: process.env.SEED_STAFF_EMAIL || 'staff@goldenfur.local',
    password: process.env.SEED_STAFF_PASSWORD || 'ChangeMe123!',
    role: 'staff',
  });

  const customer = await seedUser({
    name: process.env.SEED_CUSTOMER_NAME || 'Golden Fur Customer',
    email: process.env.SEED_CUSTOMER_EMAIL || 'customer@goldenfur.local',
    password: process.env.SEED_CUSTOMER_PASSWORD || 'ChangeMe123!',
    role: 'user',
  });

  await seedServices();
  await seedProducts();
  await seedPurchases(customer._id);

  await mongoose.disconnect();
  console.log('[db:seed] Done.');
}

seedDb().catch((err) => {
  console.error('[db:seed] Failed:', err.message);
  process.exit(1);
});
