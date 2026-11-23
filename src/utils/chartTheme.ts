import type { WorkloadStatus } from '../types/infrastructure';

export const CHART_COLORS = {
  copper: '#b8835c',
  brown: '#7a4a2e',
  teal: '#2f8a76',
  amber: '#d49b3a',
  red: '#c9533f',
  blue: '#4f74a8',
  sand: '#cdb89c'
};

export const STATUS_COLORS: Record<WorkloadStatus, string> = {
  Pending: CHART_COLORS.sand,
  Approved: CHART_COLORS.blue,
  Running: CHART_COLORS.copper,
  Completed: CHART_COLORS.teal,
  Failed: CHART_COLORS.red
};

export function chartTheme(isDark: boolean) {
  return {
    grid: isDark ? '#3a2c21' : '#eadbc4',
    axis: isDark ? '#b8a28c' : '#7a6150',
    tooltip: {
      background: isDark ? '#211913' : '#fffbf5',
      border: `1px solid ${isDark ? '#40311f' : '#e8d8c0'}`,
      borderRadius: 12,
      color: isDark ? '#f5eada' : '#2b1b11',
      fontSize: 12,
      boxShadow: '0 8px 24px rgba(43,27,17,0.12)'
    }
  };
}