/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui"
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,htm,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
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

