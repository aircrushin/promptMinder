// React Select 样式配置
export const getSelectStyles = (isCompact = false) => ({
  control: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: 'hsl(var(--background))',
    borderColor: state.isFocused
      ? 'hsl(var(--primary))'
      : 'hsl(var(--border))',
    borderRadius: 'calc(var(--radius) - 2px)',
    boxShadow: state.isFocused
      ? '0 0 0 2px hsl(var(--primary)/30%)'
      : 'none',
    '&:hover': {
      borderColor: 'hsl(var(--primary))',
    },
    minHeight: isCompact ? '36px' : '40px',
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'calc(var(--radius) - 2px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
  }),
  option: (baseStyles, { isFocused, isSelected }) => ({
    ...baseStyles,
    backgroundColor: isSelected
      ? 'hsl(var(--primary))'
      : isFocused
      ? 'hsl(var(--accent))'
      : 'transparent',
    color: isSelected
      ? 'hsl(var(--primary-foreground))'
      : 'inherit',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: 'hsl(var(--accent))',
    },
  }),
  multiValue: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: 'hsl(var(--secondary)/50%)',
    borderRadius: 'calc(var(--radius) - 2px)',
  }),
  multiValueLabel: (baseStyles) => ({
    ...baseStyles,
    color: 'hsl(var(--secondary-foreground))',
  }),
  multiValueRemove: (baseStyles) => ({
    ...baseStyles,
    color: 'hsl(var(--secondary-foreground))',
    '&:hover': {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
  }),
  singleValue: (baseStyles) => ({ ...baseStyles, color: 'hsl(var(--foreground))' }),
  placeholder: (baseStyles) => ({ ...baseStyles, color: 'hsl(var(--muted-foreground))' }),
  input: (baseStyles) => ({
    ...baseStyles,
    color: 'hsl(var(--foreground))',
  }),
});

export const getSelectTheme = (theme) => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: 'hsl(var(--primary))',
    primary75: 'hsl(var(--primary)/.75)',
    primary50: 'hsl(var(--primary)/.5)',
    primary25: 'hsl(var(--primary)/.25)',
    neutral0: 'hsl(var(--background))',
    neutral5: 'hsl(var(--muted))',
    neutral10: 'hsl(var(--secondary))',
    neutral20: 'hsl(var(--border))',
    neutral30: 'hsl(var(--border))',
    neutral40: 'hsl(var(--muted-foreground))',
    neutral50: 'hsl(var(--muted-foreground))',
    neutral60: 'hsl(var(--muted-foreground))',
    neutral70: 'hsl(var(--foreground))',
    neutral80: 'hsl(var(--foreground))',
    neutral90: 'hsl(var(--foreground))',
    danger: 'hsl(var(--destructive))',
    dangerLight: 'hsl(var(--destructive)/.25)',
  },
});
