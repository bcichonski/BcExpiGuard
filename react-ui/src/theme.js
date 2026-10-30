import { createTheme } from '@mui/material/styles';

// The app was designed on Material-UI v4 defaults. MUI v5+ changed several of them; this theme puts the
// v4 look back so the upgrade is visually neutral.
const theme = createTheme({
  // v4 breakpoint values (v5+ uses md 900 / lg 1200 / xl 1536). With these, a v4 `down('sm')` (< 960px)
  // is exactly a v7 `down('md')`, and Container maxWidth="xl" stays 1920px.
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
  // v4 default palette (v5+ defaults to blue/purple and darker status colours, and a white background).
  palette: {
    primary: { light: '#7986cb', main: '#3f51b5', dark: '#303f9f' },
    secondary: { light: '#ff4081', main: '#f50057', dark: '#c51162' },
    error: { light: '#e57373', main: '#f44336', dark: '#d32f2f' },
    warning: { light: '#ffb74d', main: '#ff9800', dark: '#f57c00' },
    info: { light: '#64b5f6', main: '#2196f3', dark: '#1976d2' },
    success: { light: '#81c784', main: '#4caf50', dark: '#388e3c' },
    background: { default: '#fafafa' },
  },
  components: {
    // v4 CssBaseline set the body in body2 (0.875rem); v5+ uses body1.
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: { ...theme.typography.body2 },
      }),
    },
    // v4 inputs defaulted to the standard (underline) variant; v5+ defaults to outlined.
    MuiTextField: { defaultProps: { variant: 'standard' } },
    // the v9 date picker field is a PickersTextField, which ignores the MuiTextField default.
    MuiPickersTextField: { defaultProps: { variant: 'standard' } },
    MuiSelect: { defaultProps: { variant: 'standard' } },
    MuiFormControl: { defaultProps: { variant: 'standard' } },
    // v4 links underlined on hover only; v5+ always underlines.
    MuiLink: { defaultProps: { underline: 'hover' } },
    // v9 ListItemIcon defaults to a 36px min-width; v4-v7 used 56px.
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 56 } } },
    // v5+ menu items squeeze a ListItemIcon to 36px and drop the ListItemText margins; v4 kept the list defaults.
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '& .MuiListItemIcon-root': { minWidth: 56 },
          '& .MuiListItemText-root': { marginTop: 4, marginBottom: 4 },
        },
      },
    },
    // v4 icon buttons had 12px (medium) / 3px (small) padding; v5+ uses 8px / 5px.
    MuiIconButton: {
      styleOverrides: {
        sizeMedium: { padding: 12 },
        sizeSmall: { padding: 3 },
      },
    },
  },
});

export default theme;
