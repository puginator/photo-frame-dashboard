#!/usr/bin/env bash
# Add photos to the frame. Run from anywhere on the Mac:
#   dashboard/scripts/add-photos.sh photo1.heic photo2.jpg ...
#   dashboard/scripts/add-photos.sh --place "Banff, AB" ~/Desktop/banff/*
# Each photo is shrunk, turned upright and stripped of GPS (scripts/prep-photo.swift), then uploaded
# to the private R2 bucket. The frame picks new photos up within an hour. See docs/photos.md.
set -euo pipefail
cd "$(dirname "$0")/.."

place=""
if [ "${1:-}" = "--place" ]; then place=${2//[\/_]/-}; shift 2; fi # '/' would split the key; '_' separates its fields
[ $# -gt 0 ] || { sed -n '2,5p' "$0"; exit 1; }

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
for f in "$@"; do
  read -r date o < <(swift scripts/prep-photo.swift "$f" "$tmp/big.jpg" "$tmp/thumb.jpg")
  name="${date}_${o}_$(shasum "$f" | cut -c1-8)${place:+_$place}"
  npx wrangler r2 object put "home-photos/photos/$name.jpg" --file "$tmp/big.jpg" --content-type image/jpeg --remote >/dev/null
  npx wrangler r2 object put "home-photos/thumbs/$name.jpg" --file "$tmp/thumb.jpg" --content-type image/jpeg --remote >/dev/null
  echo "added $name"
done
