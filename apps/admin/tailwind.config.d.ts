/** @type {import('tailwindcss').Config} */
declare const _default: {
    content: string[];
    theme: {
        extend: {
            colors: {
                bg: string;
                surface: string;
                surface2: string;
                brand: string;
                brand2: string;
                accent: string;
                on: string;
                gray: {
                    50: string;
                    100: string;
                    200: string;
                    300: string;
                    400: string;
                    500: string;
                    600: string;
                    700: string;
                    800: string;
                    900: string;
                };
                minecraft: {
                    green: string;
                    yellow: string;
                    blue: string;
                    red: string;
                    purple: string;
                    orange: string;
                };
            };
            fontFamily: {
                sans: string[];
                display: string[];
                mono: string[];
            };
            boxShadow: {
                card: string;
                glow: string;
            };
            backdropBlur: {
                xs: string;
            };
            borderRadius: {
                '2xl': string;
            };
        };
    };
    plugins: any[];
};
export default _default;
