import { createTheme, MantineColorsTuple, rem } from '@mantine/core';

const indigo: MantineColorsTuple = [
  '#EEF2FF',
  '#E0E7FF',
  '#C7D2FE',
  '#A5B4FC',
  '#818CF8',
  '#6366F1',
  '#4F46E5',
  '#4338CA',
  '#3730A3',
  '#312E81',
];

export const theme = createTheme({
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyMonospace: "'DM Mono', monospace",
  headings: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: '600',
  },
  colors: {
    indigo,
  },
  primaryColor: 'indigo',
  primaryShade: 6,
  black: '#1A1A1A',
  white: '#FFFFFF',
  defaultRadius: rem(6),
  cursorType: 'pointer',
  components: {
    Button: {
      defaultProps: {
        variant: 'subtle',
      },
      styles: {
        root: {
          fontWeight: 500,
          fontSize: rem(12),
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
          backgroundColor: 'var(--bg2)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
          '&::placeholder': {
            color: 'var(--text3)',
          },
          '&:focus': {
            borderColor: 'var(--accent)',
          },
        },
        label: {
          color: 'var(--text2)',
          fontSize: rem(10),
          fontWeight: 500,
          letterSpacing: rem(0.06),
          textTransform: 'uppercase',
        },
      },
    },
    Textarea: {
      styles: {
        input: {
          backgroundColor: 'var(--bg2)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
          '&::placeholder': {
            color: 'var(--text3)',
          },
          '&:focus': {
            borderColor: 'var(--accent)',
          },
        },
        label: {
          color: 'var(--text2)',
          fontSize: rem(10),
          fontWeight: 500,
          letterSpacing: rem(0.06),
          textTransform: 'uppercase',
        },
      },
    },
    Select: {
      styles: {
        input: {
          backgroundColor: 'var(--bg2)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        },
        dropdown: {
          backgroundColor: 'var(--bg1)',
          borderColor: 'var(--border)',
        },
        option: {
          color: 'var(--text2)',
          fontSize: rem(12),
          // Note: data-selected and hover styles are handled via CSS classes
          // in global.css to avoid React style prop warnings
        },
      },
    },
    Combobox: {
      defaultProps: {
        withinPortal: false,
      },
    },
    Chip: {
      styles: {
        label: {
          backgroundColor: 'var(--bg2)',
          borderColor: 'var(--border)',
          color: 'var(--text2)',
          fontSize: rem(10),
          // Note: data-checked styles are handled via CSS classes
          // in global.css to avoid React style prop warnings
        },
      },
    },
    Modal: {
      styles: {
        content: {
          backgroundColor: 'var(--bg1)',
          border: '1px solid var(--border)',
        },
        header: {
          backgroundColor: 'var(--bg1)',
        },
        title: {
          color: 'var(--text)',
          fontWeight: 500,
          fontSize: rem(15),
        },
      },
    },
    Progress: {
      styles: {
        root: {
          backgroundColor: 'var(--bg3)',
        },
        section: {
          backgroundColor: 'var(--accent)',
        },
      },
    },
    Badge: {
      styles: {
        root: {
          fontFamily: "'DM Mono', monospace",
          fontWeight: 400,
        },
      },
    },
  },
});
