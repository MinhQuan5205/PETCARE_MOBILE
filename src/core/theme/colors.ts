export const colors = {
  primary: {
    default: '#2563EB',
    container: '#DBEAFE',
    active: '#1D4ED8',
  },
  secondary: {
    default: '#F5B82E',
    container: '#FEF3C7',
    active: '#D99A16',
  },
  accent: {
    default: '#F5B82E',
  },
  background: {
    default: '#F8FAFC',
  },
  surface: {
    default: '#FFFFFF',
    subdued: '#F1F5F9',
  },
  border: {
    default: '#E2E8F0',
    subdued: '#E2E8F0',
  },
  text: {
    primary: '#172033',
    secondary: '#475569',
    muted: '#94A3B8',
  },
  semantic: {
    success: '#16A34A',
    successContainer: '#DCFCE7',
    warning: '#F59E0B',
    warningContainer: '#FEF3C7',
    error: '#DC2626',
    errorContainer: '#FEE2E2',
    info: '#2563EB',
    infoContainer: '#DBEAFE',
  },
} as const;

export type Colors = typeof colors;
