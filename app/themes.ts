// 🎨 Конфигурация тем оформления

export type Theme = {
  name: string;
  displayName: string;
  colors: {
    background: string;
    foreground: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    border: string;
    gradient: string;
  };
};

export const themes: Record<string, Theme> = {
  'olive-sage': {
    name: 'olive-sage',
    displayName: 'Оливковый шалфей',
    colors: {
      background: '#D8D7CC',
      foreground: '#EEEEE3',
      textPrimary: '#2A2A1A',
      textSecondary: '#5A5A4A',
      accent: '#8FA885',
      accentLight: '#A8B89F',
      accentDark: '#7A9370',
      border: '#C8C7BC',
      gradient: 'linear-gradient(135deg, #D8D7CC 0%, #CCC9BE 100%)',
    },
  },
  'coffee': {
    name: 'coffee',
    displayName: 'Кофейная',
    colors: {
      background: '#FAF6F1',
      foreground: '#FFFDFB',
      textPrimary: '#2D1B0E',
      textSecondary: '#6B5A4C',
      accent: '#6F4E37',
      accentLight: '#C9A66B',
      accentDark: '#4A3326',
      border: '#E8DCC8',
      gradient: 'linear-gradient(135deg, #FAF6F1 0%, #F5EDE3 50%, #EFE5D5 100%)',
    },
  },
  'monochrome': {
    name: 'monochrome',
    displayName: 'Монохромная',
    colors: {
      background: '#F5F5F5',
      foreground: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#666666',
      accent: '#4A4A4A',
      accentLight: '#7A7A7A',
      accentDark: '#2A2A2A',
      border: '#E0E0E0',
      gradient: 'linear-gradient(135deg, #F5F5F5 0%, #EBEBEB 50%, #E0E0E0 100%)',
    },
  },
};

export const defaultTheme = 'olive-sage';
