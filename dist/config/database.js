import { DataSource } from 'typeorm';
import { Leader } from '../models/Leader.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const AppDataSource = new DataSource({
    type: 'sqlite', // Using SQLite for simplicity
    database: path.join(__dirname, '../../database.sqlite'),
    synchronize: true, // Auto-create database schema (disable in production)
    logging: false,
    entities: [Leader],
    migrations: [],
    subscribers: [],
});
