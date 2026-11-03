# hekaiwang.github.io

Hekai Wang — academic homepage (medical image analysis, MRI).

Plain static site, no build step. GitHub Pages serves the `main` branch.

| Page | File |
| --- | --- |
| Home: photo, About, research directions, selected papers, contact | `index.html` |
| Full publication list with method figures | `publications.html` |
| Education, research, clinical & industry, skills | `experience.html` |

Shared styles and behaviour live in `style.css` and `site.js`. The header and footer are repeated in each page, so a change to the navigation must be made in all three files.

## Editing

- **Add a paper**: copy one `<article class="pub">` in `publications.html` into the right group (Accepted / Under review / Patent) and update the counts in the group title and the photo band. The `id` of the Details block must match the button's `aria-controls`. To feature it on the home page, copy a shortened version (no Details) into “Selected publications” in `index.html`.
- **Photos**: phones and portrait tablets cross-fade `hero-phone-sunset.webp`, `hero-phone-night.webp` and `hero-phone-ginkgo.webp`; larger screens cross-fade `hero-ucas-gate.webp` and `hero-ucas-aerial.webp`. Page bands: Publications uses the aerial view (night photo on phones), Experience uses the gate (ginkgo photo on phones).
- **Figures**: `assets/fig-*.webp`, shown only inside Details. `fig-reliss.webp` is the full ReLiSS architecture (not the compressed version in the current PDF).
- **Papers**: `papers/*.pdf`, recompressed (images about 240–300 dpi) to keep downloads small.
