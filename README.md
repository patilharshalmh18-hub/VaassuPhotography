# Vassu's Photography

Website for **Vassu's Photography** — maternity, newborn and family photography by Vaishnavi Pawar.

A fast, dependency-free static site: plain HTML, CSS and JavaScript, with responsive WebP images, self-hosted fonts and automatic deployment to GitHub Pages.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| Portfolio (filterable gallery + lightbox) | `portfolio.html` |
| About | `about.html` |
| Packages, process & FAQ | `packages.html` |
| Contact / booking enquiry | `contact.html` |
| Not found | `404.html` |

## Contact details and enquiries

Settings live in **`assets/js/config.js`**.

- Enquiries from the contact form are emailed to **vaishnavi.s.pawar@gmail.com** via [FormSubmit](https://formsubmit.co) (free, no account). The first enquiry sends a one-time **"Activate form"** email to that inbox; click the button in it and every enquiry after that arrives directly, with the visitor's email set as the reply-to address.
- If sending fails, the visitor is offered an "Open in email" button addressed to Vaishnavi, so no enquiry is lost.
- Add a phone number, WhatsApp number and Instagram handle in the same file to show them on the contact page.

When you have a domain, replace `https://vassus-photography.vercel.app` in the HTML `<head>` tags, `robots.txt` and `SITE_URL` in `scripts/build.py`.

## Adding or changing photos

1. Put the original JPEG in `src-images/` (e.g. `p59.jpg`).
2. Add an entry to `scripts/photos.json` with its category (`maternity`, `newborn`, `family` or `kids`) and a short description for screen readers and search engines.
3. Run the build:

   ```bash
   pip install Pillow
   python3 scripts/build.py
   ```

   This creates 480 / 960 / 1600px WebP versions plus a JPEG fallback in `assets/img/`, regenerates the portfolio gallery and home-page strip, and updates `sitemap.xml`.
4. Commit and push — Vercel redeploys automatically.

The order of photos in `photos.json` is the order they appear in the portfolio. The home-page strip is set by `STRIP` in `scripts/build.py`.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deployment (Vercel)

The site is hosted on Vercel (team **EireVeda**, project **vaassuphotography**) and connected to this repository: every push to `main` goes live automatically. There is no build step; `vercel.json` sets caching and security headers, and `.vercelignore` keeps the original photos and scripts off the public site.

To use your own domain: Vercel dashboard → project → **Settings → Domains** → add the domain, then follow the DNS instructions shown.

## Under the hood

- **Design:** lilac-linen paper, aubergine ink and a plum accent; Bodoni Moda italic for headings, Hanken Grotesk for text. Light and dark mode follow the visitor's system setting.
- **Performance:** responsive `srcset` WebP images with explicit dimensions (no layout shift), lazy loading below the fold, a preloaded hero image, self-hosted variable fonts.
- **Accessibility:** skip link, semantic landmarks, visible focus styles, descriptive alt text, a native `<dialog>` lightbox with keyboard and swipe support, labelled form fields with inline errors, reduced-motion support.
- **SEO:** unique titles and descriptions, Open Graph tags, `ProfessionalService` structured data, sitemap and robots.txt.
- **Privacy:** no trackers and no third-party font requests.

Fonts: Bodoni Moda and Hanken Grotesk, SIL Open Font License (see `assets/fonts/`).
