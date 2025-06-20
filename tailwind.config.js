module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [require("@tailwindcss/typography")],
  corePlugins: {
    preflight: false,
  },
  important: true,
  theme: {
    extend: {
      fontFamily: {
        nunito: ["Nunito", ...fontFamily.sans],
        montserrat: ["Montserrat", ...fontFamily.sans],
      },
      animation: {
        shimmer: "shimmer 2.5s infinite ease-in-out",
        "shimmer-delayed": "shimmer-delayed 2.7s infinite ease-in-out",
        "shimmer-delayed-2": "shimmer-delayed-2 2.9s infinite ease-in-out",
      },
      keyframes: {
        shimmer: {
          "0%": {
            transform: "translateX(-100%) skewX(-15deg)",
            opacity: "0",
          },
          "30%": {
            opacity: "1",
          },
          "70%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateX(300%) skewX(-15deg)",
            opacity: "0",
          },
        },
        "shimmer-delayed": {
          "0%": {
            transform: "translateX(-100%) skewX(-15deg)",
            opacity: "0",
          },
          "30%": {
            opacity: "0.8",
          },
          "70%": {
            opacity: "0.8",
          },
          "100%": {
            transform: "translateX(300%) skewX(-15deg)",
            opacity: "0",
          },
        },
        "shimmer-delayed-2": {
          "0%": {
            transform: "translateX(-100%) skewX(-15deg)",
            opacity: "0",
          },
          "30%": {
            opacity: "0.6",
          },
          "70%": {
            opacity: "0.6",
          },
          "100%": {
            transform: "translateX(300%) skewX(-15deg)",
            opacity: "0",
          },
        },
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
    screens: {
      sm: "576px",
      md: "960px",
      lg: "1385px",
    },
  },
  plugins: [],
};
