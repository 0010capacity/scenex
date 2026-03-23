import { createTheme, MantineColorsTuple, rem } from '@mantine/core';

// Custom gold accent color
const gold: MantineColorsTuple = [
  '#FFFCF2',
  '#FFF5D6',
  '#FFE89F',
  '#FFD954',
  '#FFC82A',
  '#E8A838',
  '#D4922E',
  '#B87A24',
  '#9A6620',
  '#7D521C',
];

export const theme = createTheme({
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyMonospace: "'DM Mono', monospace",
  headings: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.2' },
      h2: { fontSize: rem(24), lineHeight: '1.3' },
      h3: { fontSize: rem(18), lineHeight: '1.4' },
    },
  },
  colors: {
    gold,
    dark: [
      '#E8E5DC', // 0 - text
      '#C9C5BB', // 1
      '#9A9790', // 2 - text2
      '#6B6965', // 3
      '#4E4C48', // 4 - text3
      '#3A3836', // 5
      '#2A2826', // 6
      '#1A1C24', // 7 - bg2 (card)
      '#13141A', // 8 - bg1 (sidebar)
      '#0B0C10', // 9 - bg0 (darkest)
    ],
  },
  primaryColor: 'gold',
  primaryShade: 5,
  black: '#0B0C10',
  white: '#E8E5DC',
  defaultRadius: 'sm',
  cursorType: 'pointer',
  components: {
    Button: {
      defaultProps: {
        variant: 'subtle',
      },
      styles: {
        root: {
          fontWeight: 500,
        },
      },
    },
    ActionIcon: {
      defaultProps: {
        variant: 'subtle',
      },
    },
    TextInput: {
      styles: {
        input: {
          backgroundColor: '#1A1C24',
          borderColor: '#3A3836',
          '&:focus': {
            borderColor: '#E8A838',
          },
        },
      },
    },
    Textarea: {
      styles: {
        input: {
          backgroundColor: '#1A1C24',
          borderColor: '#3A3836',
          '&:focus': {
            borderColor: '#E8A838',
          },
        },
      },
    },
    Select: {
      styles: {
        input: {
          backgroundColor: '#1A1C24',
          borderColor: '#3A3836',
        },
        dropdown: {
          backgroundColor: '#1A1C24',
          borderColor: '#3A3836',
        },
      },
    },
    Chip: {
      styles: {
        root: {
          backgroundColor: '#1A1C24',
        },
      },
    },
    Modal: {
      styles: {
        content: {
          backgroundColor: '#13141A',
        },
        header: {
          backgroundColor: '#13141A',
        },
      },
    },
  },
});
