# Weekly Style Recipes Content Guide

This folder explains how to add a new weekly style recipe (no code changes required).

## Where to put files

Public assets and metadata live under `public/recipes` so they’re served statically.

```text
public/recipes/
  index.json                       # Ordered list of recipe slugs (newest first)
  <slug>/                          # One folder per week
    meta.json                      # Metadata for the week
    flatlay.webp (or .jpg/.png)    # Flat lay image (recommended ~1200px wide)
    model.webp (or .jpg/.png)      # Model image (recommended ~1200px wide)
```

A starter example is included:

```text
public/recipes/index.json
public/recipes/2025-10-31-autumn-monochrome/meta.json
public/recipes/placeholder-flatlay.svg
public/recipes/placeholder-model.svg
```

The example `meta.json` points at the placeholder SVGs. Replace with your real images when ready.

## 1) Add/replace images

- Provide WebP if possible (best performance). JPG/PNG also supported.
- Recommended width: ~1200px (we lazy-load and scale).
- Name your files `flatlay.webp` and `model.webp` (or specify different names in `meta.json`).

Optional: If you only have PNGs, you can convert them to WebP using the script below.

## 2) Create `meta.json`

Example schema:

```json
{
  "date": "2025-10-31",                  // Friday start ISO date (used for "Week of ...")
  "title": "Autumn Monochrome Capsule",  // Weekly recipe title
  "description": [                        // 1–3 short paragraphs
    "Paragraph 1.",
    "Paragraph 2."
  ],
  "flatlayAlt": "Accessible alt text for flat lay",
  "modelAlt": "Accessible alt text for model",
  "slug": "2025-10-31-autumn-monochrome", // Must match the folder name
  "flatlay": "flatlay.webp",               // optional, defaults to flatlay.webp
  "model": "model.webp"                   // optional, defaults to model.webp
}
```

## 3) Add the slug to `index.json`

Edit `public/recipes/index.json` (newest first):

```json
[
  "2025-11-07-cozy-neutrals",
  "2025-10-31-autumn-monochrome"
]
```

That’s it — the app will load the latest week and let users browse with arrows.

## Optional: PNG → WebP conversion

We include a small script using `sharp` that converts `*.png` in a given folder to `.webp`.

Usage (PowerShell):

```powershell
# Convert all PNGs in a folder to WebP (creates .webp next to each .png)
npm run recipes:webp -- --dir "public/recipes/2025-10-31-autumn-monochrome"
```

Notes:

- The script skips files that already have a `.webp` sibling.
- You can safely keep the original PNG/JPG alongside the WebP.

