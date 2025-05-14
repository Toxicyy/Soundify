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
      },
      screens: {
        'sm': '576px',
        'md': '960px',
        'lg': '1385px',
      },
    },
  };
  