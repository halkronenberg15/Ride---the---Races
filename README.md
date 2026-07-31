# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Version 2 Sprint 1B

- Rider profile editor for name, number, FTP, and rider archetype.
- Adaptive stage targets scale from the rider's FTP.
- Conservative, Balanced, and Aggressive tactics now change power, resistance, and recovery-block duration.
- Tactics Room displays a live preview of the selected strategy before the ride begins.
- Ride Screen uses the adapted targets throughout the stage.


## Alpha 3.5 Complete Tour

- Complete stages 1 through 21
- Rebuilt Barcelona opening stages
- Two rest-day entries
- Mountain, sprint, breakaway, and time-trial stage adaptations
- Jean briefings and in-ride radio cues for every stage
- Paris finale and complete career progression


## Alpha 3.6 Neutral Starts

- Every mass-start road stage now opens with a true neutralized rollout.
- Jean reviews the stage while riders remain behind the race director's car.
- A dedicated Kilometre Zero segment announces the flag drop and transition to race pace.
- Stages 1 and 16 use time-trial start-ramp warm-ups and official countdowns instead of neutral starts.
- Stage 21 receives an extended ceremonial procession before racing begins in Paris.


## Alpha 3.7 Full-Length Stages

All 21 Tour stages are now paced as complete indoor sessions lasting approximately 45 to 90 minutes. Flat and time-trial stages stay closer to 45–55 minutes, hilly stages run 60–70 minutes, and major mountain stages extend to 75–90 minutes. Neutral starts, kilometre zero, race phases, and cooldowns remain included in the listed duration.
