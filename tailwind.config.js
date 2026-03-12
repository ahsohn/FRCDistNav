/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				dark: {
					bg: '#0f1419',
					surface: '#1a1f2e',
					border: '#2d3748',
					text: '#e2e8f0',
					muted: '#718096'
				}
			}
		}
	},
	plugins: []
};
