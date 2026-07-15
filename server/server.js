require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./database/db');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// The UI lives in ./client (a separate Vite dev server that proxies
// these routes back here -- see client/vite.config.ts). This process is
// the JSON API only.
app.use('/', authRoutes);

async function start() {
  await connectDB();

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`[server] Golden Fur MIS (Mongo finals variant) listening on port ${port}`);
  });
}

start();
