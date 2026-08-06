/**
 * Fixed brand theme for all public-facing / global pages (outside Tenant Dashboard & Admin Dashboard).
 * Login, Registration, Email Verification, and all registration wizard steps
 * ALWAYS use this green theme (CIELAB 55.0223 -41.0774 -3.90277 -> #00A67E) regardless of Dashboard customization.
 *
 * This is architecturally separate from the dashboard theme system to prevent
 * any theme leakage between public and authenticated dashboard areas.
 */
export const BRAND_THEME_NAME = "meditek-brand";
export const BRAND_RADIUS = 0.5;

export const BRAND_THEME_VARS = {
  light: {
    background: "0 0% 100%",
    foreground: "222.2 84% 4.9%",
    card: "0 0% 100%",
    "card-foreground": "222.2 84% 4.9%",
    popover: "0 0% 100%",
    "popover-foreground": "222.2 84% 4.9%",
    primary: "165.5 100% 32.5%",
    "primary-foreground": "0 0% 100%",
    secondary: "165.5 20% 96%",
    "secondary-foreground": "222.2 47.4% 11.2%",
    muted: "165.5 20% 96%",
    "muted-foreground": "215.4 16.3% 46.9%",
    accent: "165.5 20% 96%",
    "accent-foreground": "222.2 47.4% 11.2%",
    destructive: "0 84.2% 60.2%",
    "destructive-foreground": "210 40% 98%",
    border: "214.3 31.8% 91.4%",
    input: "214.3 31.8% 91.4%",
    ring: "165.5 100% 32.5%",
    warning: "25 95% 53%",
    success: "142 71% 45%",
    info: "189 94% 43%",
    chartGird: "214.3 31.8% 91.4%",
    chartLabel: "215.3 19.3% 34.5%",
  },
  dark: {
    background: "222.2 84% 4.9%",
    foreground: "210 40% 98%",
    card: "222.2 84% 4.9%",
    "card-foreground": "210 40% 98%",
    popover: "222.2 84% 4.9%",
    "popover-foreground": "210 40% 98%",
    primary: "165.5 85% 42%",
    "primary-foreground": "0 0% 100%",
    secondary: "165.5 20% 17%",
    "secondary-foreground": "210 40% 98%",
    muted: "165.5 20% 17%",
    "muted-foreground": "215 20.2% 65.1%",
    accent: "165.5 20% 17%",
    "accent-foreground": "210 40% 98%",
    destructive: "0 62.8% 30.6%",
    "destructive-foreground": "210 40% 98%",
    border: "217.2 32.6% 17.5%",
    input: "217.2 32.6% 17.5%",
    ring: "165.5 85% 42%",
    warning: "15.3 74.6% 27.8%",
    success: "143.8 61.2% 20.2%",
    info: "196.4 63.6% 23.7%",
    chartGird: "215.3 25% 26.7%",
    chartLabel: "215 20.2% 65.1%",
  },
};
