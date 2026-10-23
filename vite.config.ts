import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    ignorePatterns: ['**/.agents/**'],
    singleQuote: true,
    sortImports: true,
    sortPackageJson: { sortScripts: true },
    sortTailwindcss: { stylesheet: './src/styles/global.css' },
  },
  lint: {
    ignorePatterns: ['**/.agents/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  staged: { '*': 'vp check --fix' },
});
