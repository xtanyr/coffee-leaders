import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import leadersRouter from './routes/leaders';
import coffeeShopsRouter from './routes/coffeeShops';
import auditRouter from './routes/audit';
import analyticsRouter from './routes/analytics';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3010;

// Middleware
const corsOptions = {
  origin: 'http://92.124.137.137:3100',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/leaders', leadersRouter);
app.use('/api/coffee-shops', coffeeShopsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/analytics', analyticsRouter);

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export { prisma };