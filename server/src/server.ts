import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.ts';

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[DeadlockSense Server] Running independently on port ${PORT}`);
});
