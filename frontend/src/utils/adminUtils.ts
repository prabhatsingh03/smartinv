import type { SystemStatistics } from '@types';

export function formatNumber(n?: number) {
  if (n === undefined || n === null) return '-';
  return new Intl.NumberFormat().format(n);
}

export function prepareTrendChartData(stats?: SystemStatistics) {
  const trend = stats?.invoices.trend || [];
  return trend.map((t) => ({ name: t.month, value: t.count }));
}

export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


