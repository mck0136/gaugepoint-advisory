# Gaugepoint Website Prototype

Static website prototype for Gaugepoint Advisory.

## Files

- `index.html` - single-page website structure and content
- `styles.css` - responsive styling and Gaugepoint palette
- `script.js` - site interactions and contact-form submission behavior
- `api/contact.js` - Vercel contact-form delivery endpoint
- `worker/` - Sites runtime and contact-form delivery endpoint
- `assets/` - Gaugepoint logo assets plus generated hero imagery

## Preview

Open `index.html` directly in a browser, or run a local server from this folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Before Launch

- Confirm current-role and association references in the founder section.
- Add a real founder photograph when available.
- Review final AI transformation language against any client confidentiality or technology-partner considerations.

## Generated Image Prompt

Built-in image generation was used for `assets/hero-intermodal-yard.png` with a prompt for a realistic North American intermodal freight environment, no readable logos, no text, and a restrained slate, steel, gray, and bronze palette.
