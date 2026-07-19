import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      '[db] MONGODB_URI is not set. Copy .env.example to .env and configure it.'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`[db] Connected to MongoDB (${mongoose.connection.name})`);
  } catch (err) {
    console.error('[db] Failed to connect to MongoDB:', (err as Error).message);
    process.exit(1);
  }
}
