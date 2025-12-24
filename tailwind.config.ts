import type { Config } from "tailwindcss";

/**
 * Tailwind CSS Configuration
 * 
 * This configuration centralizes all theme colors for the mini app.
 * To change the app's color scheme, simply update the 'primary' color value below.
 * 
 * Example theme changes:
 * - Blue theme: primary: "#3182CE"
 * - Green theme: primary: "#059669" 
 * - Red theme: primary: "#DC2626"
 * - Orange theme: primary: "#EA580C"
 */
export default {
    darkMode: "media",
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// Professional tech theme colors - Red, Blue, Yellow
  			primary: "#EF4444", // Red - main brand color
  			"primary-light": "#F87171", // Light red for hover states
  			"primary-dark": "#DC2626", // Dark red for active states
  			
  			// Professional blue colors
  			blue: {
  				DEFAULT: "#3B82F6", // Professional blue
  				light: "#60A5FA", // Light blue
  				dark: "#2563EB", // Dark blue
  				darker: "#1E40AF", // Darker blue
  			},
  			
  			// Professional yellow colors
  			yellow: {
  				DEFAULT: "#FBBF24", // Professional yellow
  				light: "#FCD34D", // Light yellow
  				dark: "#F59E0B", // Dark yellow
  			},
  			
  			// Secondary colors
  			secondary: "#F3F4F6", // Light gray background
  			"secondary-dark": "#1F2937", // Dark gray for dark mode
  			
  			// Legacy CSS variables for backward compatibility
  			background: 'var(--background)',
  			foreground: 'var(--foreground)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		// Custom spacing for consistent layout
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  		},
  		// Custom container sizes
  		maxWidth: {
  			'xs': '20rem',
  			'sm': '24rem',
  			'md': '28rem',
  			'lg': '32rem',
  			'xl': '36rem',
  			'2xl': '42rem',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
