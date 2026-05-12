# Extension Icons

Chrome extension requires PNG icons in the following sizes:
- 16x16: toolbar icon
- 48x48: extension page
- 128x128: Chrome Web Store listing

## Generate PNGs from SVG

Run the following to generate PNG icons:

```bash
# Using ImageMagick
convert icon128.svg -resize 16x16 icon16.png
convert icon128.svg -resize 48x48 icon48.png
convert icon128.svg icon128.png

# Or using online tools:
# 1. Upload SVG to https://cloudconvert.com/svg-to-png
# 2. Download all three sizes
```

## Current Icons

The extension is configured to use PNG files. For development, you can:
1. Create placeholder PNG files (any 128x128 image works)
2. Or update manifest.json to use SVG where supported

## Recommended Colors

- Primary: #4285f4 (Google Blue)
- Secondary: #34a853 (Google Green)
- Text/Icon: White