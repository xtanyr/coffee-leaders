import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Leader } from '../models/Leader.js';

const leaderRepository = AppDataSource.getRepository(Leader);

export const getLeaders = async (req: Request, res: Response) => {
  try {
    const leaders = await leaderRepository.find();
    res.json(leaders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaders', error });
  }
};

export const getLeadersByCity = async (req: Request, res: Response) => {
  try {
    const { city } = req.params;
    const leaders = await leaderRepository.find({ where: { city } });
    res.json(leaders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaders by city', error });
  }
};

export const getLeaderStats = async (req: Request, res: Response) => {
  try {
    const totalLeaders = await leaderRepository.count();
    const cities = await leaderRepository
      .createQueryBuilder('leader')
      .select('leader.city', 'city')
      .addSelect('COUNT(leader.id)', 'count')
      .groupBy('leader.city')
      .getRawMany();

    res.json({
      totalLeaders,
      statsByCity: cities,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leader statistics', error });
  }
};

export const createLeader = async (req: Request, res: Response) => {
  try {
    const leader = leaderRepository.create(req.body);
    const result = await leaderRepository.save(leader);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: 'Error creating leader', error });
  }
};

export const updateLeader = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await leaderRepository.update(id, req.body);
    const updatedLeader = await leaderRepository.findOneBy({ id: parseInt(id) });
    res.json(updatedLeader);
  } catch (error) {
    res.status(400).json({ message: 'Error updating leader', error });
  }
};

export const deleteLeader = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await leaderRepository.delete(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting leader', error });
  }
};
