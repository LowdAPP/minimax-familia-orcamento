/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '2rem',
				sm: '1rem',
				md: '2rem',
			},
			screens: {
				'2xl': '1400px',
				'xl': '1280px',
				'lg': '1200px',
			},
		},
		extend: {
			colors: {
				// Primary Brand Colors (Modern Blue)
				primary: {
					50: '#E6F0FF',
					100: '#CCE0FF',
					500: '#0066FF',
					600: '#0052CC',
					900: '#003D99',
				},
				// Neutrals (90% do sistema)
				neutral: {
					50: '#FAFAFA',
					100: '#F5F5F5',
					200: '#E5E5E5',
					500: '#A3A3A3',
					700: '#404040',
					900: '#171717',
				},
				// Semantic Colors
				success: {
					500: '#10B981',
					600: '#059669',
				},
				warning: {
					500: '#F59E0B',
					600: '#D97706',
				},
				error: {
					500: '#EF4444',
					600: '#DC2626',
				},
				// Background Colors
				page: '#FFFFFF',
				surface: '#FAFAFA',
			},
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
			},
			fontSize: {
				'hero': '64px',
				'title': '48px',
				'subtitle': '32px',
				'body-large': '20px',
				'body': '16px',
				'small': '14px',
				'caption': '12px',
			},
			lineHeight: {
				'tight': '1.1',
				'snug': '1.2',
				'normal': '1.3',
				'relaxed': '1.5',
				'loose': '1.6',
			},
			letterSpacing: {
				'tight': '-0.02em',
				'normal': '0',
				'wide': '0.01em',
			},
			spacing: {
				'xs': '8px',
				'sm': '16px',
				'md': '24px',
				'lg': '32px',
				'xl': '48px',
				'2xl': '64px',
				'3xl': '96px',
				'4xl': '128px',
			},
			borderRadius: {
				'sm': '8px',
				'base': '12px',
				'lg': '16px',
				'xl': '24px',
				'full': '9999px',
			},
			boxShadow: {
				'sm': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
				'md': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
				'lg': '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
			},
			transitionDuration: {
				'fast': '200ms',
				'base': '250ms',
				'slow': '300ms',
			},
			transitionTimingFunction: {
				'out': 'cubic-bezier(0, 0, 0.2, 1)',
				'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'slide-in-from-top': {
					'0%': { opacity: '0', transform: 'translateY(-20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 300ms ease-out',
				'slide-in': 'slide-in-from-top 250ms ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}