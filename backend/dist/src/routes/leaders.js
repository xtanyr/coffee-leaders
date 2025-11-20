"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
exports.router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/leaders - Get all leaders
exports.router.get('/', async (req, res) => {
    try {
        const leaders = await prisma.leader.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(leaders);
    }
    catch (error) {
        console.error('Error fetching leaders:', error);
        res.status(500).json({ error: 'Failed to fetch leaders' });
    }
});
// GET /api/leaders/city/:city - Get leaders by city
exports.router.get('/city/:city', async (req, res) => {
    try {
        const { city } = req.params;
        const leaders = await prisma.leader.findMany({
            where: { city },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leaders);
    }
    catch (error) {
        console.error('Error fetching leaders by city:', error);
        res.status(500).json({ error: 'Failed to fetch leaders' });
    }
});
// GET /api/leaders/stats - Get statistics
exports.router.get('/stats', async (req, res) => {
    try {
        const totalLeaders = await prisma.leader.count();
        const cityStats = await prisma.leader.groupBy({
            by: ['city'],
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });
        const stats = {
            totalLeaders,
            statsByCity: cityStats.map((stat) => ({
                city: stat.city,
                count: stat._count.id,
            })),
        };
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});
// POST /api/leaders - Create new leader
exports.router.post('/', async (req, res) => {
    try {
        const { name, startDate, endDate, birthDate, city, coffeeShop, pipName, pipEndDate, pipSuccessChance } = req.body;
        const leader = await prisma.leader.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                birthDate: new Date(birthDate),
                city,
                coffeeShop,
                pipName: pipName || null,
                pipEndDate: pipEndDate ? new Date(pipEndDate) : null,
                pipSuccessChance: pipSuccessChance ? parseInt(pipSuccessChance) : null,
            },
        });
        res.status(201).json(leader);
    }
    catch (error) {
        console.error('Error creating leader:', error);
        res.status(500).json({ error: 'Failed to create leader' });
    }
});
// PUT /api/leaders/:id - Update leader
exports.router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, startDate, endDate, birthDate, city, coffeeShop, pipName, pipEndDate, pipSuccessChance } = req.body;
        const leader = await prisma.leader.update({
            where: { id: parseInt(id) },
            data: {
                name,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                birthDate: new Date(birthDate),
                city,
                coffeeShop,
                pipName: pipName !== undefined ? pipName : undefined,
                pipEndDate: pipEndDate !== undefined ? (pipEndDate ? new Date(pipEndDate) : null) : undefined,
                pipSuccessChance: pipSuccessChance !== undefined ? (pipSuccessChance ? parseInt(pipSuccessChance) : null) : undefined,
            },
        });
        res.json(leader);
    }
    catch (error) {
        console.error('Error updating leader:', error);
        res.status(500).json({ error: 'Failed to update leader' });
    }
});
// DELETE /api/leaders/:id - Delete leader
exports.router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.leader.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting leader:', error);
        res.status(500).json({ error: 'Failed to delete leader' });
    }
});
exports.default = exports.router;
//# sourceMappingURL=leaders.js.map