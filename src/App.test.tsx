import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./api', () => ({
  leadersApi: { getAll: () => Promise.resolve({ data: [] }) },
  coffeeShopsApi: { getAll: () => Promise.resolve({ data: [] }) },
  auditApi: { getEntries: () => Promise.resolve({ data: [] }) },
  analyticsApi: { getAttritionReport: () => Promise.resolve({ data: null }) },
}));

test('uses ИПВ in the leader table and development plan form', async () => {
  render(<App />);

  expect(
    await screen.findByText((_, element) =>
      element !== null &&
      element.classList.contains('metric-label') &&
      element.textContent?.includes('ИПВ') === true
    )
  ).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'ИПВ' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Добавить Лидера/i }));

  expect(screen.getByText('План развития (ИПВ)')).toBeInTheDocument();
  expect(screen.getByText('Ссылка на ИПВ')).toBeInTheDocument();
  expect(screen.getByText('Дата окончания ИПВ')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Удалить ИПВ' })).toBeInTheDocument();
  expect(screen.queryByText(/ИПР/)).not.toBeInTheDocument();
});
