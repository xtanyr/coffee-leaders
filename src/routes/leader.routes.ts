import { Router } from 'express';
import * as leaderController from '../controllers/leader.controller.js';

const router = Router();

// Get all leaders
router.get('/', leaderController.getLeaders);

// Get leaders by city
router.get('/city/:city', leaderController.getLeadersByCity);

// Get leader statistics
router.get('/stats', leaderController.getLeaderStats);

// Create a new leader
router.post('/', leaderController.createLeader);

// Update a leader
router.put('/:id', leaderController.updateLeader);

// Delete a leader
router.delete('/:id', leaderController.deleteLeader);

export default router;
