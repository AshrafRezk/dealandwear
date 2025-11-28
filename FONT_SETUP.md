# The Seasons Font Setup

The website uses "The Seasons" as the primary brand font. You have two options to set it up:

## Option 1: Adobe Fonts (Recommended)

1. Go to [Adobe Fonts - The Seasons](https://fonts.adobe.com/fonts/the-seasons)
2. Click "Add to Web Project" or create a new web project
3. Copy your Adobe Fonts kit ID
4. In `index.html`, uncomment and update this line:
   ```html
   <link rel="stylesheet" href="https://use.typekit.net/YOUR-KIT-ID.css">
   ```
   Replace `YOUR-KIT-ID` with your actual kit ID from Adobe Fonts.

5. The font will automatically load as `'the-seasons'` and be applied site-wide.

## Option 2: Self-Hosted Fonts

1. Obtain the font files (WOFF2 format recommended)
2. Place them in `public/fonts/` directory:
   - `TheSeasons-Regular.woff2`
   - `TheSeasons-Bold.woff2`
   - `TheSeasons-Italic.woff2`
3. The `@font-face` declarations in `src/fonts.css` will automatically load them.

**Note:** Make sure you have the proper license for web use if self-hosting.

## Current Setup

The CSS is configured to use:
- `'the-seasons'` (Adobe Fonts name)
- `'The Seasons'` (self-hosted name)
- Fallback to serif fonts if neither is available

The font is applied globally through `src/index.css`.

