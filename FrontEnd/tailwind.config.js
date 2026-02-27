/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Escala de Castanhos
        tomar: {
          50: "#FCFAF9",
          100: "#F4ECE7",
          200: "#E3D1C5", 
          300: "#D2B5A3",
          400: "#C29A80",
          500: "#B17E5E",
          600: "#946648",
          700: "#724E37",
          800: "#503626",
          900: "#2D1F16", 
        },
        // Escala de Verdes 
        success: {
          50: "#EBFFEB",
          100: "#D1FFD2",
          200: "#9EFFA0",
          300: "#6BFF6E",
          400: "#38FF3C",
          500: "#05FF0A",
          600: "#00D104",
          700: "#009E03",
          800: "#006B02",
          900: "#003801",
        },
        // Escala de Laranjas 
        brand: {
          50: "#FFF0E5",
          100: "#FFE0CC",
          200: "#FFC299",
          300: "#FFA366",
          400: "#FF8533", // Atual 'accent'
          500: "#FF6600",
          600: "#CC5200",
          700: "#993D00",
          800: "#662900",
          900: "#331400",
        },
        // Escala de Amarelos 
        warning: {
          50: "#FFFAEA",
          100: "#FFF3D1",
          200: "#FFE59E",
          300: "#FFD76B", 
          400: "#FFCA38",
          500: "#FFBC05",
          600: "#D19900",
          700: "#9E7400",
          800: "#6B4E00",
          900: "#382900",
        },
        // Escala de Vermelhos 
        error: {
          50: "#FFE5E5",
          100: "#FFCCCC",
          200: "#FF9999",
          300: "#FF6666",
          400: "#FF3333",
          500: "#FF0000",
          600: "#CC0000",
          700: "#990000",
          800: "#660000",
          900: "#330000",
        },
        primary: "#2D1F16",
        accent: "#FF6600",
        tabColor: "#FFBC05"
      },
    },
  },
  plugins: [],
};
