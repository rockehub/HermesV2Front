const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

const navyColor = {
  50:  "#EDF6F9",
  100: "#D0E7EF",
  200: "#A2CDDA",
  300: "#74B3C5",
  400: "#4998B0",
  450: "#2D7D99",
  500: "#1C6584",
  600: "#16546C",
  700: "#104454",
  750: "#0C3947",
  800: "#092F3B",
  900: "#06232C",
};

const customColors = {
  navy: navyColor,
  "slate-150": "#F4F1F8", // lilac-tinted light
  primary: "#FF6B6B",        // coral red
  "primary-focus": "#E63946", // deeper coral red
  "secondary-light": "#FFE066", // sunny yellow
  secondary: "#FFD23F",        // rich yellow
  "secondary-focus": "#FFB703", // bold golden
  "accent-light": "#C3F0CA",   // minty green
  accent: "#80ED99",           // vivid mint
  "accent-focus": "#57CC99",   // deeper mint green
  info: "#5BC0EB",             // light sky blue
  "info-focus": "#3A86FF",     // bold blue
  success: "#06D6A0",          // vibrant teal
  "success-focus": "#1B9C85",  // stronger teal
  warning: "#F4A261",          // soft orange
  "warning-focus": "#E76F51",  // earthy orange
  error: "#EF476F",            // hot pink-red
  "error-focus": "#D62839",    // dark raspberry
};



module.exports = {
  content: [
    "./src/**/*.{php,html,js,jsx,ts,tsx,vue}",
    "./src/bin/**/platform/*.{php,html,js,jsx,ts,tsx,vue}",
    "./resources/**/*.{php,html,js,jsx,ts,tsx,vue}",
  ],
  darkMode: "class",
  theme: {
    extend: {
        gridTemplateColumns: {
          '16': 'repeat(16, minmax(0, 1fr))',
          '5': 'repeat(7, minmax(0, 1fr))',
          '6': 'repeat(7, minmax(0, 1fr))',
          '7': 'repeat(7, minmax(0, 1fr))',
          '8': 'repeat(8, minmax(0, 1fr))',
          '9': 'repeat(9, minmax(0, 1fr))',
          '10': 'repeat(10, minmax(0, 1fr))',
          '11': 'repeat(11, minmax(0, 1fr))',
          '12': 'repeat(12, minmax(0, 1fr))',
        },
      fontFamily: {
        sans: ["Poppins", ...defaultTheme.fontFamily.sans],
        inter: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        tiny: ["0.625rem", "0.8125rem"],
        "tiny+": ["0.6875rem", "0.875rem"],
        "xs+": ["0.8125rem", "1.125rem"],
        "sm+": ["0.9375rem", "1.375rem"],
      },
      colors: { ...customColors },
      opacity: {
        15: ".15",
      },
      spacing: {
        4.5: "1.125rem",
        5.5: "1.375rem",
        18: "4.5rem",
      },
      boxShadow: {
        soft: "0 3px 10px 0 rgb(48 46 56 / 6%)",
        "soft-dark": "0 3px 10px 0 rgb(25 33 50 / 30%)",
      },
      zIndex: {
        1: "1",
        2: "2",
        3: "3",
        4: "4",
        5: "5",
      },
      keyframes: {
        "fade-out": {
          "0%": {
            opacity: 1,
            visibility: "visible",
          },
          "100%": {
            opacity: 0,
            visibility: "hidden",
          },
        },
      },
    },
  },
  corePlugins: {
    textOpacity: false,
    backgroundOpacity: false,
    borderOpacity: false,
    divideOpacity: false,
    placeholderOpacity: false,
    ringOpacity: false,
  },
};
