import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

export const router = Router();
const prisma = new PrismaClient();

// GET /api/audit - list audit entries (latest first)
router.get('/', async (req, res) => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const entries = await prisma.auditEntry.findMany({
      where: city ? { city } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching audit entries:', error);
    res.status(500).json({ error: 'Failed to fetch audit entries' });
  }
});

// GET /api/audit/latest - get most recent entry
router.get('/latest', async (req, res) => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const latestEntry = await prisma.auditEntry.findFirst({
      where: city ? { city } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    res.json(latestEntry);
  } catch (error) {
    console.error('Error fetching latest audit entry:', error);
    res.status(500).json({ error: 'Failed to fetch latest audit entry' });
  }
});

// POST /api/audit - create audit entry
router.post('/', async (req, res) => {
  try {
    const { requiredLeaders, targetDate, city, note } = req.body;

    if (requiredLeaders === undefined || !targetDate || !city) {
      return res.status(400).json({ error: 'requiredLeaders, targetDate and city are required' });
    }

    const entry = await prisma.auditEntry.create({
      data: {
        requiredLeaders: parseInt(requiredLeaders, 10),
        targetDate: new Date(targetDate),
        city,
        note: note || null
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating audit entry:', error);
    res.status(500).json({ error: 'Failed to create audit entry' });
  }
});

export default router;
