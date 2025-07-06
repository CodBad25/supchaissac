import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  darkMode: ["class"],
  content: [
    './client/index.html',
    './client/src/**/*.{js,ts,jsx,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        rcd: {
          DEFAULT: "hsl(var(--rcd))",
          foreground: "hsl(var(--rcd-foreground))",
          100: "hsl(271 81% 96%)",
          800: "hsl(271 81% 16%)",
        },
        "devoirs-faits": {
          DEFAULT: "hsl(var(--devoirs-faits))",
          foreground: "hsl(var(--devoirs-faits-foreground))",
          100: "hsl(221 83% 96%)",
          800: "hsl(221 83% 16%)",
        },
        autre: {
          DEFAULT: "hsl(var(--autre))",
          foreground: "hsl(var(--autre-foreground))",
          100: "hsl(45 93% 96%)",
          800: "hsl(45 93% 16%)",
        },
        pending: {
          DEFAULT: "hsl(var(--pending))",
          foreground: "hsl(var(--pending-foreground))",
          100: "hsl(45 93% 96%)",
          500: "hsl(45 93% 47%)",
          800: "hsl(45 93% 16%)",
        },
        validated: {
          DEFAULT: "hsl(var(--validated))",
          foreground: "hsl(var(--validated-foreground))",
          100: "hsl(142 76% 96%)",
          500: "hsl(142 76% 36%)",
          800: "hsl(142 76% 16%)",
        },
        paid: {
          DEFAULT: "hsl(var(--paid))",
          foreground: "hsl(var(--paid-foreground))",
          100: "hsl(142 76% 96%)",
          500: "hsl(142 76% 36%)",
          800: "hsl(142 76% 16%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;
