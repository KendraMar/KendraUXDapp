#!/bin/bash
# Generate PNG icons from the SVG source
# Requires ImageMagick: brew install imagemagick

cd "$(dirname "$0")/icons"

if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required. Install with: brew install imagemagick"
    exit 1
fi

convert -background none icon.svg -resize 16x16 icon-16.png
convert -background none icon.svg -resize 32x32 icon-32.png
convert -background none icon.svg -resize 48x48 icon-48.png
convert -background none icon.svg -resize 128x128 icon-128.png

echo "Icons generated successfully!"
ls -la *.png
