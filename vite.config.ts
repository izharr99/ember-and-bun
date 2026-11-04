import { defineConfig } from 'vite';
import content from './src/content.json' with { type: 'json' };

const fontFamilies = [content.theme.fontDisplay, content.theme.fontBody]
  .map((f, i) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}${i ? ':opsz,wght@12..96,400..800' : ''}`)
  .join('&');

/** Injects brand name, description, theme colour and fonts from content.json into index.html. */
export default defineConfig({
  plugins: [
    {
      name: 'content-html',
      transformIndexHtml: (source) =>
        source
          .replaceAll('%BRAND_NAME%', content.brand.name.replace(/&/g, '&amp;'))
          .replaceAll('%BRAND_TAGLINE%', content.brand.tagline)
          .replaceAll('%BRAND_DESCRIPTION%', content.brand.description)
          .replaceAll('%THEME_BG%', content.theme.paper)
          .replaceAll('%FONTS_URL%', `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`),
    },
  ],
});
