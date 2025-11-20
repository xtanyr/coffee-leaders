export interface Leader {
  id: number;
  name: string;
  startDate: string;
  endDate?: string;
  birthDate: string;
  city: string;
  coffeeShop: string;
  pipName?: string | null;
  pipEndDate?: string | null;
  pipSuccessChance?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoffeeShop {
  id: number;
  name: string;
  city: string;
  openingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalLeaders: number;
  statsByCity: Array<{
    city: string;
    count: number;
  }>;
}

export type City =
  | 'Омск'
  | 'Москва'
  | 'Казань'
  | 'Санкт-Петербург'
  | 'Новосибирск'
  | 'Нижний Новгород'
  | 'Самара';