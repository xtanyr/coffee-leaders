"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
exports.router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/coffee-shops - Get all coffee shops
exports.router.get('/', async (req, res) => {
    try {
        const coffeeShops = await prisma.coffeeShop.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(coffeeShops);
    }
    catch (error) {
        console.error('Error fetching coffee shops:', error);
        res.status(500).json({ error: 'Failed to fetch coffee shops' });
    }
});
// GET /api/coffee-shops/city/:city - Get coffee shops by city
exports.router.get('/city/:city', async (req, res) => {
    try {
        const { city } = req.params;
        const coffeeShops = await prisma.coffeeShop.findMany({
            where: { city },
            orderBy: { createdAt: 'desc' }
        });
        res.json(coffeeShops);
    }
    catch (error) {
        console.error('Error fetching coffee shops by city:', error);
        res.status(500).json({ error: 'Failed to fetch coffee shops' });
    }
});
// POST /api/coffee-shops - Create new coffee shop
exports.router.post('/', async (req, res) => {
    try {
        const { name, city, openingDate } = req.body;
        const coffeeShop = await prisma.coffeeShop.create({
            data: {
                name,
                city,
                openingDate: openingDate ? new Date(openingDate) : null,
            },
        });
        res.status(201).json(coffeeShop);
    }
    catch (error) {
        console.error('Error creating coffee shop:', error);
        res.status(500).json({ error: 'Failed to create coffee shop' });
    }
});
// PUT /api/coffee-shops/:id - Update coffee shop
exports.router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, city, openingDate } = req.body;
        const coffeeShop = await prisma.coffeeShop.update({
            where: { id: parseInt(id) },
            data: {
                name,
                city,
                openingDate: openingDate ? new Date(openingDate) : null,
            },
        });
        res.json(coffeeShop);
    }
    catch (error) {
        console.error('Error updating coffee shop:', error);
        res.status(500).json({ error: 'Failed to update coffee shop' });
    }
});
// DELETE /api/coffee-shops/:id - Delete coffee shop
exports.router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.coffeeShop.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting coffee shop:', error);
        res.status(500).json({ error: 'Failed to delete coffee shop' });
    }
});
exports.default = exports.router;
//# sourceMappingURL=coffeeShops.js.map