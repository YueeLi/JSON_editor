# PROJECT_NOTES — JSON Editor

Repo: https://github.com/YueeLi/JSON_editor

Production (Vercel): https://json-editor-inky.vercel.app/

## What this app does

- Paste JSON text (or a JSON **string** that contains JSON)
- Validate and show line/column errors (via `jsonlint-mod`)
- Live structured preview (react-json-view-lite)
- Format (pretty) / minify (one-line) output + copy

## Local development

```bash
cd json-editor
npm ci
npm run dev
# build check
npm run build
```

## UX / correctness notes

### 1) Theme toggle + Tailwind dark mode

This project uses Tailwind v4. By default, `dark:` follows `prefers-color-scheme`.
To make the **in-app toggle** control dark mode:

- `src/app/globals.css`: switch dark variant to class-based with `@custom-variant dark ...`
- `src/app/layout.tsx`: inline script sets `.dark` on `<html>` before paint (avoids flash)
- `src/app/page.tsx`: persist theme preference in `localStorage` and toggle `document.documentElement.classList`

### 2) Live validation + JsonView updates

- Use `useEffect` + debounce (~250ms) to validate as the user types.
- Keep `error` and `jsonObj` in sync so the preview updates immediately when input becomes valid.

### 3) “string → JSON” second-parse

If parsing results in a **string** that itself looks like JSON (starts with `{`/`[`), attempt one extra parse.
Example input:

```json
"{\"a\":1}"
```

Expected preview value:

```json
{"a":1}
```

## SEO checklist (Next.js App Router)

- [x] `html lang="zh-CN"`
- [x] Add richer `metadata` (title template, description, keywords)
- [x] `metadataBase` (required for absolute OG URLs)
- [x] `alternates.canonical`
- [x] OpenGraph + Twitter metadata
- [x] `src/app/robots.ts`
- [x] `src/app/sitemap.ts`

### Optional follow-ups

- Add a custom `app/icon.png` + OG image for richer shares.
- Add analytics (Vercel Analytics / Plausible) and track copy/format/minify events.
- Add more tools: JSONPath, sort keys, remove comments, YAML↔JSON.
- Consider Web Worker for validation on very large JSON.
