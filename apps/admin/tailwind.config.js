/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                // Minecraft.net official colors
                bg: '#08080f',
                surface: '#11111e',
                surface2: '#1c1c2e',
                brand: '#00e676',
                brand2: '#00b85c',
                accent: '#ffd700',
                on: '#eeeeff',
                gray: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827',
                },
                // Minecraft specific colors
                minecraft: {
                    green: '#00D084',
                    yellow: '#FFD83D',
                    blue: '#00A8CC',
                    red: '#FF6B6B',
                    purple: '#8B5CF6',
                    orange: '#F59E0B',
                },
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                display: ['Cinzel', 'serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                card: '0 12px 28px rgba(0,0,0,.35)',
                glow: '0 0 20px rgba(70, 201, 58, 0.3)',
            },
            backdropBlur: {
                xs: '2px',
            },
            borderRadius: { '2xl': '1.25rem' },
        },
    },
    plugins: [],
};
