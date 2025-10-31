import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import leadersRouter from './routes/leaders';
import coffeeShopsRouter from './routes/coffeeShops';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/leaders', leadersRouter);
app.use('/api/coffee-shops', coffeeShopsRouter);

// Health check
app.get('/api/health', (req: any, res: any) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { prisma };