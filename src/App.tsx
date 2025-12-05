import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import './audit-styles.css';
import {
  Leader,
  CoffeeShop,
  City,
  AuditEntry,
  AttritionReport,
  CalendarForecast,
  LeaderAttritionInsight,
  CalendarMonthForecast,
} from './types';
import { leadersApi, coffeeShopsApi, auditApi, analyticsApi } from './api';

const CITIES: City[] = [
  'Омск',
  'Москва',
  'Казань',
  'Санкт-Петербург',
  'Новосибирск',
  'Нижний Новгород',
  'Самара'
];

const ANALYTICS_HORIZON_MONTHS = 12;

type CalendarCardData = {
  monthKey: string;
  label: string;
  startDate: string;
  endDate: string;
  contextLabel: string;
  expectedAttritions: number;
  plannedOpenings: number;
  netLeadersNeeded: number;
  cities: CalendarMonthForecast['cities'];
};

const STORAGE_KEYS = {
  cityFilter: 'coffee-leaders:lastCityFilter',
  showOnlyActive: 'coffee-leaders:showOnlyActive'
};

const getStoredString = (key: string, fallback = ''): string => {
  if (typeof window === 'undefined') return fallback;
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ?? fallback;
  } catch (error) {
    console.warn(`Не удалось прочитать ${key} из localStorage`, error);
    return fallback;
  }
};

const getStoredBoolean = (key: string, fallback = false): boolean => {
  if (typeof window === 'undefined') return fallback;
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue === null ? fallback : storedValue === 'true';
  } catch (error) {
    console.warn(`Не удалось прочитать ${key} из localStorage`, error);
    return fallback;
  }
};

function App() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [currentCityFilter, setCurrentCityFilter] = useState<string>(() => getStoredString(STORAGE_KEYS.cityFilter));
  const [activeTab, setActiveTab] = useState<'leader' | 'coffeeShop'>('leader');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(() => getStoredBoolean(STORAGE_KEYS.showOnlyActive));
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [latestAuditEntry, setLatestAuditEntry] = useState<AuditEntry | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [attritionReport, setAttritionReport] = useState<AttritionReport | null>(null);
  const [calendarForecast, setCalendarForecast] = useState<CalendarForecast | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const selectedCityLabel = currentCityFilter ? `для ${currentCityFilter}` : 'по всем городам';

  const attritionByLeader = useMemo(() => {
    const map = new Map<number, LeaderAttritionInsight>();
    attritionReport?.leaders.forEach(leader => {
      map.set(leader.leaderId, leader);
    });
    return map;
  }, [attritionReport]);

  const calendarCards = useMemo<CalendarCardData[]>(() => {
    if (!calendarForecast) {
      return [];
    }

    return calendarForecast.months.map(month => {
      const targetCities = currentCityFilter
        ? month.cities.filter(city => city.city === currentCityFilter)
        : month.cities;

      const aggregates = targetCities.reduce(
        (acc, cityRow) => {
          acc.expectedAttritions += cityRow.expectedAttritions;
          acc.plannedOpenings += cityRow.plannedOpenings;
          acc.netLeadersNeeded += cityRow.netLeadersNeeded;
          return acc;
        },
        { expectedAttritions: 0, plannedOpenings: 0, netLeadersNeeded: 0 }
      );

      const totals = currentCityFilter ? aggregates : month.totals;
      const citiesForCard = currentCityFilter ? targetCities : month.cities.slice(0, 4);

      return {
        monthKey: month.monthKey,
        label: month.label,
        startDate: month.startDate,
        endDate: month.endDate,
        contextLabel: selectedCityLabel,
        expectedAttritions: totals.expectedAttritions,
        plannedOpenings: totals.plannedOpenings,
        netLeadersNeeded: totals.netLeadersNeeded,
        cities: citiesForCard,
      };
    });
  }, [calendarForecast, currentCityFilter, selectedCityLabel]);

  const calendarCardsToRender = calendarCards.slice(0, 6);

  const getProbabilityForWindow = (leader: LeaderAttritionInsight, months: number) =>
    leader.probabilities
      .filter(prob => prob.monthIndex <= months)
      .reduce((sum, prob) => sum + prob.probability, 0);

  const formatProbability = (value: number | null) =>
    value === null ? '—' : `${(value * 100).toFixed(value * 100 >= 10 ? 0 : 1)}%`;

  const probabilityLevel = (value: number) => {
    if (value >= 0.5) return 'high';
    if (value >= 0.25) return 'medium';
    return 'low';
  };

  const formatDecimal = (value: number) => (value < 1 ? value.toFixed(2) : value.toFixed(1));

  const formatMonthRange = (start: string) =>
    new Date(start).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
    });

  // Form states
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [editingCoffeeShop, setEditingCoffeeShop] = useState<CoffeeShop | null>(null);

  // Form data
  const [leaderForm, setLeaderForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    birthDate: '',
    city: '',
    coffeeShop: '',
    pipName: '',
    pipEndDate: '',
    pipSuccessChance: ''
  });
  const hasPipValues = Boolean(
    leaderForm.pipName || leaderForm.pipEndDate || leaderForm.pipSuccessChance
  );

  const [coffeeShopForm, setCoffeeShopForm] = useState({
    name: '',
    city: '',
    openingDate: ''
  });

  const [auditForm, setAuditForm] = useState({
    requiredLeaders: '',
    targetDate: '',
    city: '',
    note: ''
  });
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);
  const [editingAuditId, setEditingAuditId] = useState<number | null>(null);
  const [editingAudit, setEditingAudit] = useState<{
    requiredLeaders: string;
    targetDate: string;
    city: string;
    note: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.cityFilter, currentCityFilter);
    } catch (error) {
      console.warn('Не удалось сохранить выбранный город', error);
    }
  }, [currentCityFilter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.showOnlyActive, String(showOnlyActive));
    } catch (error) {
      console.warn('Не удалось сохранить состояние фильтра активных лидеров', error);
    }
  }, [showOnlyActive]);

  const loadData = async () => {
    try {
      const [leadersRes, coffeeShopsRes, auditEntriesRes] = await Promise.all([
        leadersApi.getAll(),
        coffeeShopsApi.getAll(),
        auditApi.getEntries()
      ]);

      setLeaders(leadersRes.data);
      setCoffeeShops(coffeeShopsRes.data);
      setAuditEntries(auditEntriesRes.data);
      fetchAnalytics();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const [reportRes, calendarRes] = await Promise.all([
        analyticsApi.getAttritionReport(ANALYTICS_HORIZON_MONTHS),
        analyticsApi.getCalendarForecast(ANALYTICS_HORIZON_MONTHS),
      ]);
      setAttritionReport(reportRes.data ?? null);
      setCalendarForecast(calendarRes.data ?? null);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsError('Не удалось загрузить аналитические данные. Попробуйте позже.');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const refreshAuditEntries = async () => {
    try {
      const entriesRes = await auditApi.getEntries();
      setAuditEntries(entriesRes.data);
    } catch (error) {
      console.error('Error loading audit entries:', error);
    } finally {
      setEditingAuditId(null);
      setEditingAudit(null);
    }
  };

  const handleEditAudit = (entry: AuditEntry) => {
    setEditingAuditId(entry.id);
    setEditingAudit({
      requiredLeaders: entry.requiredLeaders.toString(),
      targetDate: entry.targetDate.split('T')[0],
      city: entry.city,
      note: entry.note || ''
    });
  };

  const handleUpdateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAuditId || !editingAudit) return;

    try {
      setIsSubmittingAudit(true);
      await auditApi.update(editingAuditId, {
        requiredLeaders: parseInt(editingAudit.requiredLeaders, 10),
        targetDate: editingAudit.targetDate,
        city: editingAudit.city,
        note: editingAudit.note || null
      });
      await refreshAuditEntries();
    } catch (error) {
      console.error('Error updating audit entry:', error);
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  const handleDeleteAudit = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
    
    try {
      await auditApi.delete(id);
      await refreshAuditEntries();
    } catch (error) {
      console.error('Error deleting audit entry:', error);
    }
  };

  useEffect(() => {
    if (!auditEntries.length) {
      setLatestAuditEntry(null);
      return;
    }

    if (currentCityFilter) {
      const entryForCity = auditEntries.find(entry => entry.city === currentCityFilter);
      setLatestAuditEntry(entryForCity || null);
    } else {
      setLatestAuditEntry(auditEntries[0]);
    }
  }, [auditEntries, currentCityFilter]);

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auditForm.requiredLeaders || !auditForm.targetDate || !auditForm.city) {
      return;
    }

    try {
      setIsSubmittingAudit(true);
      const payload = {
        requiredLeaders: parseInt(auditForm.requiredLeaders, 10),
        targetDate: auditForm.targetDate,
        city: auditForm.city,
        note: auditForm.note || undefined,
      };

      await auditApi.create(payload);
      await refreshAuditEntries();
      setAuditForm(prev => ({ ...prev, requiredLeaders: '', targetDate: '', note: '' }));
    } catch (error) {
      console.error('Error saving audit entry:', error);
    } finally {
      setIsSubmittingAudit(false);
    }
  };


  const filteredLeaders = (currentCityFilter
    ? leaders.filter(leader => leader.city === currentCityFilter)
    : leaders).filter(leader => !showOnlyActive || !leader.endDate);

  const sortedLeaders = [...filteredLeaders].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'age':
        const aEndDate = a.endDate ? new Date(a.endDate) : new Date();
        const bEndDate = b.endDate ? new Date(b.endDate) : new Date();
        aValue = Math.floor((aEndDate.getTime() - new Date(a.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        bValue = Math.floor((bEndDate.getTime() - new Date(b.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        break;
      case 'city':
        aValue = a.city;
        bValue = b.city;
        break;
      case 'coffeeShop':
        aValue = a.coffeeShop;
        bValue = b.coffeeShop;
        break;
      case 'worktime':
        const aStart = new Date(a.startDate);
        const aRef = a.endDate ? new Date(a.endDate) : new Date();
        const bStart = new Date(b.startDate);
        const bRef = b.endDate ? new Date(b.endDate) : new Date();
        aValue = Math.floor((aRef.getTime() - aStart.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
        bValue = Math.floor((bRef.getTime() - bStart.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
        break;
      case 'endDate':
        aValue = a.endDate ? new Date(a.endDate).getTime() : Infinity;
        bValue = b.endDate ? new Date(b.endDate).getTime() : Infinity;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredCoffeeShops = currentCityFilter
    ? coffeeShops.filter(shop => shop.city === currentCityFilter)
    : coffeeShops;

  const handleCityFilter = (city: string) => {
    setCurrentCityFilter(city);
  };

  const updateCoffeeShopOptions = (city: string) => {
    // This will be used when city changes in leader form
  };

  const clearPipFields = () => {
    setLeaderForm((prev) => ({
      ...prev,
      pipName: '',
      pipEndDate: '',
      pipSuccessChance: ''
    }));
  };

  const handleLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPipName = leaderForm.pipName.trim();
    const pipNameValue = trimmedPipName ? trimmedPipName : null;
    const pipEndDateValue = leaderForm.pipEndDate ? leaderForm.pipEndDate : null;
    const pipSuccessInput = leaderForm.pipSuccessChance.trim();
    const pipSuccessValue = pipSuccessInput === ''
      ? null
      : (() => {
          const parsed = parseInt(pipSuccessInput, 10);
          if (Number.isNaN(parsed)) {
            return null;
          }
          return Math.max(0, Math.min(100, parsed));
        })();

    const leaderData = {
      name: leaderForm.name,
      startDate: leaderForm.startDate,
      endDate: leaderForm.endDate || undefined,
      birthDate: leaderForm.birthDate,
      city: leaderForm.city,
      coffeeShop: leaderForm.coffeeShop,
      pipName: pipNameValue,
      pipEndDate: pipEndDateValue,
      pipSuccessChance: pipSuccessValue
    };

    try {
      if (editingLeader) {
        await leadersApi.update(editingLeader.id, leaderData);
      } else {
        await leadersApi.create(leaderData);
      }

      setLeaderForm({ 
        name: '', 
        startDate: '', 
        endDate: '', 
        birthDate: '', 
        city: '', 
        coffeeShop: '',
        pipName: '',
        pipEndDate: '',
        pipSuccessChance: ''
      });
      setEditingLeader(null);
      setShowFormModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving leader:', error);
    }
  };

  const handleCoffeeShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const coffeeShopData = {
      name: coffeeShopForm.name,
      city: coffeeShopForm.city,
      openingDate: coffeeShopForm.openingDate || null
    };

    try {
      if (editingCoffeeShop) {
        await coffeeShopsApi.update(editingCoffeeShop.id, coffeeShopData);
      } else {
        await coffeeShopsApi.create(coffeeShopData);
      }

      setCoffeeShopForm({ name: '', city: '', openingDate: '' });
      setEditingCoffeeShop(null);
      setShowFormModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving coffee shop:', error);
    }
  };

  const editLeader = (leader: Leader) => {
    setLeaderForm({
      name: leader.name,
      startDate: leader.startDate.split('T')[0],
      endDate: leader.endDate ? leader.endDate.split('T')[0] : '',
      birthDate: leader.birthDate.split('T')[0],
      city: leader.city,
      coffeeShop: leader.coffeeShop,
      pipName: leader.pipName || '',
      pipEndDate: leader.pipEndDate ? leader.pipEndDate.split('T')[0] : '',
      pipSuccessChance:
        leader.pipSuccessChance !== null && leader.pipSuccessChance !== undefined
          ? leader.pipSuccessChance.toString()
          : ''
    });
    setEditingLeader(leader);
    setActiveTab('leader');
    setShowFormModal(true);
  };

  const editCoffeeShop = (coffeeShop: CoffeeShop) => {
    setCoffeeShopForm({
      name: coffeeShop.name,
      city: coffeeShop.city,
      openingDate: coffeeShop.openingDate ? coffeeShop.openingDate.split('T')[0] : ''
    });
    setEditingCoffeeShop(coffeeShop);
    setActiveTab('coffeeShop');
    setShowFormModal(true);
  };

  const deleteLeader = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого лидера?')) {
      try {
        await leadersApi.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting leader:', error);
      }
    }
  };

  const deleteCoffeeShop = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту кофейню?')) {
      try {
        await coffeeShopsApi.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting coffee shop:', error);
      }
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ru-RU');
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('ru-RU');
  const pipLeadersCount = filteredLeaders.filter(leader => leader.pipName && !leader.endDate).length;
  const displayedAuditEntries = currentCityFilter
    ? auditEntries.filter(entry => entry.city === currentCityFilter)
    : auditEntries;

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Лидеры Кофеен</h1>
      </header>

      <div className="city-filter">
        <button
          className={`city-btn ${currentCityFilter === '' ? 'active' : ''}`}
          onClick={() => handleCityFilter('')}
        >
          Все города
        </button>
        {CITIES.map(city => (
          <button
            key={city}
            className={`city-btn ${currentCityFilter === city ? 'active' : ''}`}
            onClick={() => handleCityFilter(city)}
          >
            {city === 'Санкт-Петербург' ? 'СПб' :
             city === 'Нижний Новгород' ? 'Н.Новгород' : city}
          </button>
        ))}
      </div>

      {(analyticsError || isLoadingAnalytics) && (
        <section className="analytics-section">
          <h2 className="section-title">Прогноз ухода лидеров</h2>
          {analyticsError && (
            <div className="analytics-error">{analyticsError}</div>
          )}
          {isLoadingAnalytics && (
            <div className="analytics-loading">Загружаем прогнозы…</div>
          )}
        </section>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-number">{(() => {
            const activeLeaders = leaders.filter(leader => !leader.endDate);
            if (activeLeaders.length === 0) return '0';

            const totalMonths = activeLeaders.reduce((sum, leader) => {
              const startDate = new Date(leader.startDate);
              const months = Math.floor((new Date().getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
              return sum + months;
            }, 0);

            return Math.round(totalMonths / activeLeaders.length);
          })()} мес.</div>
          <div className="metric-label">Средний стаж активных</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">{(() => {
            const firedLeaders = leaders.filter(leader => leader.endDate);
            if (firedLeaders.length === 0) return '0';

            const totalMonths = firedLeaders.reduce((sum, leader) => {
              const startDate = new Date(leader.startDate);
              const endDate = new Date(leader.endDate!);
              const months = Math.floor((endDate.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
              return sum + months;
            }, 0);

            return Math.round(totalMonths / firedLeaders.length);
          })()} мес.</div>
          <div className="metric-label">Средний стаж уволенных</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">{(() => {
            const cityLeaders = currentCityFilter
              ? leaders.filter(leader => leader.city === currentCityFilter)
              : leaders;
            if (cityLeaders.length === 0) return '0';

            const totalMonths = cityLeaders.reduce((sum, leader) => {
              const startDate = new Date(leader.startDate);
              const referenceDate = leader.endDate ? new Date(leader.endDate) : new Date();
              const months = Math.floor((referenceDate.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
              return sum + months;
            }, 0);

            return Math.round(totalMonths / cityLeaders.length);
          })()} мес.</div>
          <div className="metric-label">Средний стаж в {currentCityFilter || 'компании'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">{filteredLeaders.length}</div>
          <div className="metric-label">Лидеров {currentCityFilter ? `в ${currentCityFilter}` : 'всего'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-number">{pipLeadersCount}</div>
          <div className="metric-label">На PIP {currentCityFilter ? `в ${currentCityFilter}` : 'в компании'}</div>
        </div>
      </div>

      <div className="audit-summary">
        <div className="audit-summary-card">
          <div className="audit-summary-title">
            {currentCityFilter ? `Журнал для ${currentCityFilter}` : 'Журнал по всем городам'}
          </div>
          {latestAuditEntry ? (
            <div className="audit-summary-content">
              <div className="audit-summary-value">{latestAuditEntry.requiredLeaders} лидеров</div>
              <div className="audit-summary-detail">
                К сроку: <strong>{formatDate(latestAuditEntry.targetDate)}</strong>
              </div>
              <div className="audit-summary-detail">
                Город: <strong>{latestAuditEntry.city}</strong>
              </div>
              {latestAuditEntry.note && (
                <div className="audit-summary-note">
                  <span className="audit-summary-note-label">Комментарий:</span>
                  <span>{latestAuditEntry.note}</span>
                </div>
              )}
              <div className="audit-summary-stamp">
                Заявка создана: {formatDateTime(latestAuditEntry.createdAt)}
              </div>
            </div>
          ) : (
            <div className="audit-summary-empty">
              {currentCityFilter
                ? `Для города ${currentCityFilter} записей ещё нет`
                : 'Записей в журнале пока нет'}
            </div>
          )}
        </div>
      </div>

      <div className="main-content">
        <div className="tab-buttons" style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '30px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            className={`tab-btn ${activeTab === 'leader' ? 'active' : ''}`}
            onClick={() => setActiveTab('leader')}
            style={{
              padding: '12px 28px',
              border: '2px solid #59c9a5ff',
              background: activeTab === 'leader' ? '#59c9a5ff' : 'white',
              color: activeTab === 'leader' ? 'white' : '#071013ff',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'leader' 
                ? '0 6px 20px rgba(89, 201, 165, 0.4)' 
                : '0 4px 15px rgba(89, 201, 165, 0.2)',
            }}
            onMouseOver={(e) => {
              if (activeTab !== 'leader') {
                e.currentTarget.style.background = '#f3e8eeff';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(89, 201, 165, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'leader') {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(89, 201, 165, 0.2)';
              }
            }}
          >
            Показать Лидеров
          </button>
          <button
            className={`tab-btn ${activeTab === 'coffeeShop' ? 'active' : ''}`}
            onClick={() => setActiveTab('coffeeShop')}
            style={{
              padding: '12px 28px',
              border: '2px solid #ff5a5fff',
              background: activeTab === 'coffeeShop' ? '#ff5a5fff' : 'white',
              color: activeTab === 'coffeeShop' ? 'white' : '#071013ff',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'coffeeShop' 
                ? '0 6px 20px rgba(255, 90, 95, 0.4)' 
                : '0 4px 15px rgba(255, 90, 95, 0.2)',
            }}
            onMouseOver={(e) => {
              if (activeTab !== 'coffeeShop') {
                e.currentTarget.style.background = '#f3e8eeff';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 90, 95, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'coffeeShop') {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 90, 95, 0.2)';
              }
            }}
          >
            Показать Кофейни
          </button>
        </div>
        
        <div className="action-buttons">
          <button
            className="add-btn"
            onClick={() => {
              setActiveTab('leader');
              setEditingLeader(null);
              setLeaderForm({ 
                name: '', 
                startDate: '', 
                endDate: '', 
                birthDate: '', 
                city: '', 
                coffeeShop: '',
                pipName: '',
                pipEndDate: '',
                pipSuccessChance: ''
              });
              setShowFormModal(true);
            }}
          >
            ➕ Добавить Лидера
          </button>
          <button
            className="add-btn"
            onClick={() => {
              setActiveTab('coffeeShop');
              setEditingCoffeeShop(null);
              setCoffeeShopForm({ name: '', city: '', openingDate: '' });
              setShowFormModal(true);
            }}
          >
            ➕ Добавить Кофейню
          </button>
          {activeTab === 'leader' && (
            <button
              className={`filter-btn ${showOnlyActive ? 'active' : ''}`}
              onClick={() => setShowOnlyActive(!showOnlyActive)}
            >
              {showOnlyActive ? 'Показать всех' : 'Только активные'}
            </button>
          )}
        </div>

        <div className="leaders-panel">
          <h2 className="panel-title">
            {activeTab === 'leader' ? 'Команда Лидеров' : 'Кофейни'}
          </h2>
          <div className="leaders-list">
            {activeTab === 'leader' ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('name')}>
                      ФИО {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('age')}>
                      Возраст {sortField === 'age' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('city')}>
                      Город {sortField === 'city' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('coffeeShop')}>
                      Отделение {sortField === 'coffeeShop' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('worktime')}>
                      Стаж работы {sortField === 'worktime' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('endDate')}>
                      Дата увольнения {sortField === 'endDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sortable">
                      Риск ухода (3 мес)
                    </th>
                    <th>PIP</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Calculate overall average worktime
                    const allLeadersWorktime = leaders.map(leader => {
                      const startDate = new Date(leader.startDate);
                      const referenceDate = leader.endDate ? new Date(leader.endDate) : new Date();
                      return Math.floor((referenceDate.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
                    });
                    const averageWorktime = allLeadersWorktime.length > 0
                      ? allLeadersWorktime.reduce((sum, months) => sum + months, 0) / allLeadersWorktime.length
                      : 0;

                    return sortedLeaders.map(leader => {
                      const endDate = leader.endDate ? new Date(leader.endDate) : new Date();
                      const ageInYears = Math.floor((endDate.getTime() - new Date(leader.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

                      const startDate = new Date(leader.startDate);
                      const referenceDate = leader.endDate ? new Date(leader.endDate) : new Date();
                      const monthsWorked = Math.floor((referenceDate.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));

                      const attrition = attritionByLeader.get(leader.id);
                      const probability3 = attrition ? getProbabilityForWindow(attrition, 3) : null;

                      return (
                        <tr key={leader.id}>
                          <td>{leader.name}</td>
                          <td>{ageInYears} лет</td>
                          <td>{leader.city}</td>
                          <td>{leader.coffeeShop}</td>
                          <td className={monthsWorked > averageWorktime ? 'highlight-above-average' : ''}>
                            {monthsWorked} мес.
                          </td>
                          <td>{leader.endDate ? new Date(leader.endDate).toLocaleDateString() : 'Работает'}</td>
                          <td className={`attrition-cell ${attrition && probability3 !== null ? 'probability-' + probabilityLevel(probability3) : ''}`}>
                            <div className="attrition-cell-values">
                              <span>{formatProbability(probability3)}</span>
                            </div>
                          </td>
                          <td>
                            {leader.pipName && (
                              <div className={`pip-info ${
                                leader.endDate ? 'pip-completed' : 
                                leader.pipEndDate && new Date(leader.pipEndDate) < new Date() ? 'pip-at-risk' :
                                'pip-in-progress'
                              }`}>
                                <div><strong>{leader.pipName}</strong></div>
                                {leader.pipEndDate && (
                                  <div>
                                    <span className="pip-label">До: </span>
                                    {new Date(leader.pipEndDate).toLocaleDateString()}
                                    {!leader.endDate && new Date(leader.pipEndDate) < new Date() && (
                                      <span className="pip-warning"> (просрочен)</span>
                                    )}
                                  </div>
                                )}
                                {leader.pipSuccessChance !== null && leader.pipSuccessChance !== undefined && (
                                  <div>
                                    <span className="pip-label">Шанс успеха: </span>
                                    <span className={`pip-chance ${
                                      leader.pipSuccessChance >= 70 ? 'pip-chance-high' :
                                      leader.pipSuccessChance >= 30 ? 'pip-chance-medium' : 'pip-chance-low'
                                    }`}>
                                      {leader.pipSuccessChance}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <button className="action-btn edit-btn" onClick={() => editLeader(leader)}>
                              ✏️
                            </button>
                            <button className="action-btn delete-btn" onClick={() => deleteLeader(leader.id)}>
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Название кофейни</th>
                    <th>Город</th>
                    <th>Дата открытия</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoffeeShops.map(shop => (
                    <tr key={shop.id}>
                      <td>{shop.name}</td>
                      <td>{shop.city}</td>
                      <td>{shop.openingDate ? new Date(shop.openingDate).toLocaleDateString() : 'Не указана'}</td>
                      <td>
                        <button className="action-btn edit-btn" onClick={() => editCoffeeShop(shop)}>
                          ✏️
                        </button>
                        <button className="action-btn delete-btn" onClick={() => deleteCoffeeShop(shop.id)}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <section className="audit-section">
        <h2 className="audit-section-title">Журнал потребности в лидерах</h2>
        <p className="audit-section-description">
          Зафиксируйте, сколько лидеров требуется к определённой дате. Запись автоматически получит
          временную метку подачи.
        </p>

        <form className="audit-form" onSubmit={handleAuditSubmit}>
          <div className="audit-form-grid">
            <div className="form-group">
              <label className="form-label">Количество лидеров</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={auditForm.requiredLeaders}
                onChange={(e) => setAuditForm({ ...auditForm, requiredLeaders: e.target.value })}
                placeholder="Например, 12"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Целевая дата</label>
              <input
                type="date"
                className="form-input"
                value={auditForm.targetDate}
                onChange={(e) => setAuditForm({ ...auditForm, targetDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Город заявки</label>
              <select
                className="form-select"
                value={auditForm.city}
                onChange={(e) => setAuditForm({ ...auditForm, city: e.target.value })}
                required
              >
                <option value="">Выберите город</option>
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Комментарий</label>
              <textarea
                className="form-input"
                value={auditForm.note}
                onChange={(e) => setAuditForm({ ...auditForm, note: e.target.value })}
                placeholder="Дополнительная информация"
                rows={3}
              />
            </div>
          </div>
          <button type="submit" className="audit-submit-btn" disabled={isSubmittingAudit}>
            {isSubmittingAudit ? 'Сохраняем...' : 'Записать в журнал'}
          </button>
        </form>

        <div className="audit-full-list">
          <h3 className="audit-subtitle">
            Полный журнал {currentCityFilter ? `для города ${currentCityFilter}` : 'по всем городам'}
          </h3>
          {displayedAuditEntries.length ? (
            <div className="audit-table-wrapper">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Город</th>
                    <th>Лидеров требуется</th>
                    <th>К дате</th>
                    <th>Создано</th>
                    <th style={{ minWidth: '300px' }}>Комментарий</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAuditEntries.map(entry => (
                    <tr key={entry.id}>
                      {editingAuditId === entry.id && editingAudit ? (
                        <>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={editingAudit.city}
                              onChange={(e) => setEditingAudit({...editingAudit, city: e.target.value})}
                            >
                              {CITIES.map(city => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-input form-input-sm"
                              value={editingAudit.requiredLeaders}
                              onChange={(e) => setEditingAudit({...editingAudit, requiredLeaders: e.target.value})}
                              min="1"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-input form-input-sm"
                              value={editingAudit.targetDate}
                              onChange={(e) => setEditingAudit({...editingAudit, targetDate: e.target.value})}
                            />
                          </td>
                          <td>{formatDateTime(entry.createdAt)}</td>
                          <td>
                            <textarea
                              className="form-input form-input-sm"
                              value={editingAudit.note}
                              onChange={(e) => setEditingAudit({...editingAudit, note: e.target.value})}
                              rows={2}
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td className="actions-cell">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={handleUpdateAudit}
                              disabled={isSubmittingAudit}
                            >
                              {isSubmittingAudit ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button
                              className="btn btn-sm btn-secondary ml-1"
                              onClick={() => {
                                setEditingAuditId(null);
                                setEditingAudit(null);
                              }}
                              disabled={isSubmittingAudit}
                            >
                              Отмена
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{entry.city}</td>
                          <td>{entry.requiredLeaders}</td>
                          <td>{formatDate(entry.targetDate)}</td>
                          <td>{formatDateTime(entry.createdAt)}</td>
                          <td className="comment-cell">{entry.note || '—'}</td>
                          <td className="actions-cell">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEditAudit(entry)}
                            >
                              Изменить
                            </button>
                            <button
                              className="btn btn-sm btn-danger ml-1"
                              onClick={() => handleDeleteAudit(entry.id)}
                            >
                              Удалить
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="audit-empty">
              {currentCityFilter ? `В городе ${currentCityFilter} записей нет` : 'Записей пока нет'}
            </div>
          )}
        </div>
      </section>

      {/* Modal for forms */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowFormModal(false)}>✕</button>

            {activeTab === 'leader' && (
              <div className="tab-content">
                <h2 className="form-title">
                  {editingLeader ? 'Редактировать Лидера' : 'Добавить Лидера'}
                </h2>
                <form onSubmit={handleLeaderSubmit}>
                  <div className="form-group">
                    <label className="form-label">Имя</label>
                    <input
                      type="text"
                      className="form-input"
                      value={leaderForm.name}
                      onChange={(e) => setLeaderForm({...leaderForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Дата начала</label>
                    <input
                      type="date"
                      className="form-input"
                      value={leaderForm.startDate}
                      onChange={(e) => setLeaderForm({...leaderForm, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Дата увольнения</label>
                    <input
                      type="date"
                      className="form-input"
                      value={leaderForm.endDate}
                      onChange={(e) => setLeaderForm({...leaderForm, endDate: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Дата рождения</label>
                    <input
                      type="date"
                      className="form-input"
                      value={leaderForm.birthDate}
                      onChange={(e) => setLeaderForm({...leaderForm, birthDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Город</label>
                    <select
                      className="form-select"
                      value={leaderForm.city}
                      onChange={(e) => {
                        setLeaderForm({...leaderForm, city: e.target.value, coffeeShop: ''});
                        updateCoffeeShopOptions(e.target.value);
                      }}
                      required
                    >
                      <option value="">Выберите город</option>
                      {CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Кофейня</label>
                    <select
                      className="form-select"
                      value={leaderForm.coffeeShop}
                      onChange={(e) => setLeaderForm({...leaderForm, coffeeShop: e.target.value})}
                      required
                    >
                      <option value="">Выберите кофейню</option>
                      {coffeeShops
                        .filter(shop => !leaderForm.city || shop.city === leaderForm.city)
                        .map(shop => (
                          <option key={shop.id} value={shop.name}>{shop.name}</option>
                        ))}
                    </select>
                  </div>
                  
                  <h3 className="form-section-title">План развития (PIP)</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Название PIP</label>
                    <input
                      type="text"
                      className="form-input"
                      value={leaderForm.pipName}
                      onChange={(e) => setLeaderForm({...leaderForm, pipName: e.target.value})}
                      placeholder="Например: Улучшение показателей продаж"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Дата окончания PIP</label>
                    <input
                      type="date"
                      className="form-input"
                      value={leaderForm.pipEndDate}
                      onChange={(e) => setLeaderForm({...leaderForm, pipEndDate: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Вероятность успеха (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-input"
                      value={leaderForm.pipSuccessChance}
                      onChange={(e) => setLeaderForm({...leaderForm, pipSuccessChance: e.target.value})}
                      placeholder="0-100"
                    />
                  </div>

                  <div className="pip-actions">
                    <button
                      type="button"
                      className="pip-clear-btn"
                      onClick={clearPipFields}
                      disabled={!hasPipValues}
                    >
                      Удалить PIP
                    </button>
                  </div>
                  
                  <button type="submit" className="submit-btn">
                    {editingLeader ? 'Обновить Лидера' : 'Добавить Лидера'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'coffeeShop' && (
              <div className="tab-content">
                <h2 className="form-title">
                  {editingCoffeeShop ? 'Редактировать Кофейню' : 'Добавить Кофейню'}
                </h2>
                <form onSubmit={handleCoffeeShopSubmit}>
                  <div className="form-group">
                    <label className="form-label">Название кофейни</label>
                    <input
                      type="text"
                      className="form-input"
                      value={coffeeShopForm.name}
                      onChange={(e) => setCoffeeShopForm({...coffeeShopForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Город</label>
                    <select
                      className="form-select"
                      value={coffeeShopForm.city}
                      onChange={(e) => setCoffeeShopForm({...coffeeShopForm, city: e.target.value})}
                      required
                    >
                      <option value="">Выберите город</option>
                      {CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Дата открытия (необязательно)</label>
                    <input
                      type="date"
                      className="form-input"
                      value={coffeeShopForm.openingDate}
                      onChange={(e) => setCoffeeShopForm({...coffeeShopForm, openingDate: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="submit-btn">
                    {editingCoffeeShop ? 'Обновить Кофейню' : 'Добавить Кофейню'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
