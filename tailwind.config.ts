import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "ice-white": "#F5F6FC",
        "asphalt-black": "#130A06",
        "midnight-express": "#000741",
        "gold-bar": "#FFC919",
      },
    },
  },
  plugins: [],
};

export default config;
