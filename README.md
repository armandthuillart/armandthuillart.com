<div align="center">

# Armand Thuillart

[![Astro](https://img.shields.io/badge/Astro-FF5D01?style=flat-square&logo=astro&logoColor=white)](https://astro.build/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite+](https://img.shields.io/badge/Vite+-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

Source code for [armandthuillart.com](https://armandthuillart.com). Built with Astro, Tailwind CSS, and MDX.

> [!NOTE]
> Use `vp` commands instead of `npm`, `pnpm`, or `yarn`. Vite+ handles all dependencies, formatting, and tasks.

## Setup

```bash
vpr i
vpr dev
```

The site runs at `http://localhost:4321`.

## Commands

| Command       | Action               |
| ------------- | -------------------- |
| `vpr dev`     | Start dev server     |
| `vpr check`   | Check types          |
| `vpr lint`    | Lint code            |
| `vpr build`   | Build to `dist/`     |
| `vpr preview` | Test build           |
| `vpr deploy`  | Deploy to Cloudflare |

## Content

Posts live in `src/content/blog/<locale>/`.

**Frontmatter (`src/content.config.ts`)**

- `title` (string)
- `description` (string)
- `icon` (string, optional)
- `date` (date, optional)
- `draft` (boolean, optional)

Posts with an `icon` and `date` (and `draft` not `true`) appear on the home page.

## Playable apps

Venture pages link to the apps at `/en/apps/<slug>/` and `/fr/apps/<slug>/`. Each app lives under `src/apps/<slug>/` and uses its original React or Svelte components in an Astro island. Database and service boundaries run against local mock state. Each route loads its own styles.

Dimsight's model, manifest, preview images, and drawings are served from `public/apps/dimsight/assets/`. They are a matching artifact bundle downloaded from R2; running the app does not require R2 access.

## Languages

Pages live under `/en/` (default) or `/fr/`. UI strings are in `messages/<locale>.json`. To translate a post, add a file with the same name under its locale folder, for example `src/content/blog/fr/bio.mdx`. Untranslated content falls back to English.

## Markdown for agents

Send `Accept: text/markdown` to get any page as markdown. Posts are also at `/<locale>/blog/<slug>.md`.

## Deploy

```bash
vpr build
vpr deploy
```
