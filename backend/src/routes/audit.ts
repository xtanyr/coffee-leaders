import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

export const router = Router();
const prisma = new PrismaClient();

// Helper function to handle BigInt serialization
const replacer = (key: string, value: any) => 
  typeof value === 'bigint' ? value.toString() : value;

const sendJson = (res: any, data: any) => 
  res.type('application/json').send(JSON.stringify(data, replacer));

// GET /api/audit - list audit entries (latest first)
router.get('/', async (req, res) => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const entries = await prisma.auditEntry.findMany({
      where: city ? { city } : undefined,
      orderBy: { createdAt: 'desc' }
    });
    sendJson(res, entries);
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
    sendJson(res, latestEntry);
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

// DELETE /api/audit/:id - delete audit entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if the entry exists
    const existingEntry = await prisma.auditEntry.findUnique({
      where: { id: parsedId }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Audit entry not found' });
    }

    // Delete the entry
    await prisma.auditEntry.delete({
      where: { id: parsedId }
    });

    res.status(200).json({ message: 'Audit entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting audit entry:', error);
    res.status(500).json({ error: 'Failed to delete audit entry' });
  }
});

// PUT /api/audit/:id - update audit entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { requiredLeaders, targetDate, city, note } = req.body;
    const parsedId = parseInt(id, 10);
    
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Check if the entry exists
    const existingEntry = await prisma.auditEntry.findUnique({
      where: { id: parsedId }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Audit entry not found' });
    }

    // Update the entry
    const updatedEntry = await prisma.auditEntry.update({
      where: { id: parsedId },
      data: {
        ...(requiredLeaders !== undefined && { requiredLeaders: parseInt(requiredLeaders, 10) }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        ...(city && { city }),
        ...(note !== undefined && { note: note || null })
      }
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating audit entry:', error);
    res.status(500).json({ error: 'Failed to update audit entry' });
  }
});

export default router;
