import axios from 'axios';
import {
  Leader,
  CoffeeShop,
  Stats,
  AuditEntry,
  AttritionReport,
  CalendarForecast,
} from './types';

const API_BASE_URL = 'http://92.124.137.137:3011/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout
});

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    return config;
  },
  error => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('[API] Response error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API] No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('[API] Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

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

// Audit API
export const auditApi = {
  getEntries: (city?: string) =>
    api.get<AuditEntry[]>(
      '/audit',
      city ? { params: { city } } : undefined
    ),
  getLatest: (city?: string) =>
    api.get<AuditEntry | null>(
      '/audit/latest',
      city ? { params: { city } } : undefined
    ),
  create: (entry: { requiredLeaders: number; targetDate: string; city: string; note?: string }) =>
    api.post<AuditEntry>('/audit', entry),
  update: (id: number, entry: { requiredLeaders?: number; targetDate?: string; city?: string; note?: string | null }) =>
    api.put<AuditEntry>(`/audit/${id}`, entry),
  delete: (id: number) => api.delete(`/audit/${id}`),
};

// Analytics API
const ensureParams = (horizon?: number) =>
  horizon ? { params: { horizon } } : undefined;

export const analyticsApi = {
  getAttritionReport: (horizon?: number) =>
    api.get<AttritionReport | null>('/analytics/attrition', ensureParams(horizon)),
  getCalendarForecast: (horizon?: number) =>
    api.get<CalendarForecast | null>('/analytics/calendar', ensureParams(horizon)),
};