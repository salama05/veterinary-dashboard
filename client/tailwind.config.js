/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#6366f1', // Indigo 500 - Modern & Vibrant
                secondary: '#ec4899', // Pink 500
                success: '#10b981', // Emerald 500
                warning: '#f59e0b', // Amber 500
                danger: '#ef4444', // Red 500
                background: '#f3f4f6', // Gray 100
                surface: '#ffffff',
                // Dark mode specific
                darkBackground: '#0f172a', // Slate 900
                darkSurface: '#1e293b', // Slate 800
            },
            fontFamily: {
                sans: ['Cairo', 'sans-serif'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }
        },
    },
    plugins: [],
}
