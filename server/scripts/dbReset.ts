import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(import.meta.dirname, '..', '.env') });

const COLLECTIONS_TO_RESET = ['users', 'services', 'products', 'purchases'];

async function resetDb() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      '[db:reset] MONGODB_URI is not set. Copy server/.env.example to server/.env and configure it.'
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`[db:reset] Connected to MongoDB (${mongoose.connection.name})`);

  for (const name of COLLECTIONS_TO_RESET) {
    const result = await mongoose.connection.collection(name).deleteMany({});
    console.log(
      `[db:reset] Cleared ${name}: ${result.deletedCount} document(s) removed`
    );
  }

  await mongoose.disconnect();
  console.log('[db:reset] Done.');
}

resetDb().catch((err) => {
  console.error('[db:reset] Failed:', err.message);
  process.exit(1);
});
