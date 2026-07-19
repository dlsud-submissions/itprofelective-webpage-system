import 'dotenv/config';
import { app } from './app.js';
import { connectDB } from './shared/database/db.js';

async function start() {
  await connectDB();

  const port = process.env.PORT || 4321;
  app.listen(port, () => {
    console.log(
      `[server] Golden Fur MIS (Mongo finals variant) listening on port ${port}`
    );
  });
}

start();
