import axios from 'axios';
import { Leader, CoffeeShop, Stats } from './types';

const API_BASE_URL = 'http://localhost:3010/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Leaders API
export const leadersApi = {
  getAll: () => api.get<Leader[]>('/leaders'),
  getByCity: (city: string) => api.get<Leader[]>(`/leaders/city/${city}`),
  create: (leader: Omit<Leader, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Leader>('/leaders', leader),
  update: (id: number, leader: Partial<Leader>) =>
    api.put<Leader>(`/leaders/${id}`, leader),
  delete: (id: number) => api.delete(`/leaders/${id}`),
  getStats: () => api.get<Stats>('/leaders/stats'),
};

// Coffee Shops API
export const coffeeShopsApi = {
  getAll: () => api.get<CoffeeShop[]>('/coffee-shops'),
  getByCity: (city: string) => api.get<CoffeeShop[]>(`/coffee-shops/city/${city}`),
  create: (coffeeShop: Omit<CoffeeShop, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<CoffeeShop>('/coffee-shops', coffeeShop),
  update: (id: number, coffeeShop: Partial<CoffeeShop>) =>
    api.put<CoffeeShop>(`/coffee-shops/${id}`, coffeeShop),
  delete: (id: number) => api.delete(`/coffee-shops/${id}`),
};