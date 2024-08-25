/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui"
import typography from "@tailwindcss/typography"
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,htm,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  // daisyUI config (optional - here are the default values)
  daisyui: {
    themes: ["dark", "light", "retro", "cyberpunk", "valentine", "aqua"], // false: only light + dark | true: all themes | array: specific themes like this ["light", "dark", "cupcake"]
    darkTheme: "dark", // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
    themeRoot: ":root", // The element that receives theme color CSS variables
  },
  plugins: [typography, daisyui],
  safelist: [
    'input-primary',
    'input-secondary',
    'input-accent',
    'input-success',
    'input-warning',
    'input-error',
    'input-neutral',
    'input-disabled',
    'input-readonly',
    'input-hover',
    'input-focus',
  ]    
}