import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts}",
  ],
  theme: {
    // Replace default breakpoints entirely — none of sm/md/lg/xl/2xl are used
    screens: {
      'phone': {'max': '767px'},
      'pad-v': {'min': '768px', 'max': '1023px'},
      'pad': {'min': '1024px', 'max': '1279px'},
      'pc': {'min': '1280px'},
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind's reset to avoid conflicts with Ant Design
  },
} satisfies Config;
