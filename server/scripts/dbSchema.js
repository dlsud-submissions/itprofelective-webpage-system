const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Mirrors server/models/User.js, Service.js, and Product.js. Update here
// whenever one of those Mongoose schemas changes -- this is the DB-level
// enforcement layer (via $jsonSchema validators), Mongoose is the app-level one.
const COLLECTIONS = [
  {
    name: 'users',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'email', 'passwordHash', 'role', 'isBanned', 'createdAt'],
        properties: {
          name: { bsonType: 'string' },
          email: { bsonType: 'string' },
          passwordHash: { bsonType: 'string' },
          role: { enum: ['user', 'staff', 'admin'] },
          isBanned: { bsonType: 'bool' },
          createdAt: { bsonType: 'date' },
        },
      },
    },
    indexes: [[{ email: 1 }, { unique: true }]],
  },
  {
    name: 'services',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'price', 'isActive', 'createdAt'],
        properties: {
          name: { bsonType: 'string' },
          description: { bsonType: 'string' },
          price: { bsonType: 'number', minimum: 0 },
          category: { bsonType: 'string' },
          isActive: { bsonType: 'bool' },
          createdAt: { bsonType: 'date' },
        },
      },
    },
    indexes: [[{ isActive: 1 }, {}]],
  },
  {
    name: 'products',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'price', 'stock', 'isActive', 'createdAt'],
        properties: {
          name: { bsonType: 'string' },
          description: { bsonType: 'string' },
          price: { bsonType: 'number', minimum: 0 },
          stock: { bsonType: 'number', minimum: 0 },
          isActive: { bsonType: 'bool' },
          createdAt: { bsonType: 'date' },
        },
      },
    },
    indexes: [[{ isActive: 1 }, {}]],
  },
];

async function applySchema() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[db:schema] MONGODB_URI is not set. Copy server/.env.example to server/.env and configure it.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log(`[db:schema] Connected to MongoDB (${mongoose.connection.name})`);

  const existingNames = (await db.listCollections().toArray()).map((c) => c.name);

  for (const { name, validator, indexes } of COLLECTIONS) {
    if (existingNames.includes(name)) {
      await db.command({ collMod: name, validator, validationLevel: 'moderate' });
      console.log(`[db:schema] Updated validator on existing collection: ${name}`);
    } else {
      await db.createCollection(name, { validator, validationLevel: 'moderate' });
      console.log(`[db:schema] Created collection with validator: ${name}`);
    }

    for (const [keys, options] of indexes) {
      await db.collection(name).createIndex(keys, options);
    }
    console.log(`[db:schema] Ensured indexes on: ${name}`);
  }

  await mongoose.disconnect();
  console.log('[db:schema] Done.');
}

applySchema().catch((err) => {
  console.error('[db:schema] Failed:', err.message);
  process.exit(1);
});
