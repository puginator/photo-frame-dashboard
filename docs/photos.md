# Family photos

The frame's slideshow (home tile, Photos page, screensaver) shows photos from a private Cloudflare R2
bucket, `home-photos`. Until the bucket has a photo, it shows the demo photos.

## Add photos

On the Mac, from the repo folder:

```sh
dashboard/scripts/add-photos.sh ~/Desktop/pumpkin-patch/*
dashboard/scripts/add-photos.sh --place "Lake Padden" IMG_4021.HEIC IMG_4022.HEIC
```

- Any photos work: iPhone HEIC, JPEG or PNG. Export them from Photos or Amazon Photos to a folder first.
- `--place` sets the caption for every photo in that run. Leave it out for no place.
- Each photo is shrunk (1280 px and a 400 px thumbnail), turned upright, and stripped of all metadata,
  including GPS, before it leaves the Mac. Originals stay on the Mac.
- The frame picks up new photos within an hour. To see them now, reload the frame
  (`scripts/set-kiosk-url.sh` with the same URL, see [hosting](hosting.md)).

The date shown ("3 years ago", "On this day") is when the photo was taken. If a photo has no camera
date, name the file starting with the date, e.g. `2019-07-04 fireworks.jpg`; otherwise the file's
modified date is used.

Adding the same photo twice is harmless: it gets the same name and replaces itself. Adding the same photo
with a different `--place` makes a second copy, so delete the old one.

## Remove a photo

Find it in the Cloudflare dashboard (R2 → `home-photos` → `photos/`), then delete both copies:

```sh
cd dashboard
npx wrangler r2 object delete "home-photos/photos/<name>.jpg" --remote
npx wrangler r2 object delete "home-photos/thumbs/<name>.jpg" --remote
```

It disappears from the frame within an hour. Deleting every photo brings the demo photos back.

## How it works

- Names carry the metadata: `photos/<date>_<l|p>_<hash>[_<place>].jpg`, e.g.
  `photos/2024-05-19_p_a1b2c3d4_Lake Padden.jpg` (`l`/`p` = landscape/portrait). There is no other
  database: `dashboard/worker.js` lists the bucket for `/manifest.json`.
- Photos and the manifest sit behind the same frame key as the rest of the site. The bucket itself
  is not public.
- The resizing happens on the Mac (`dashboard/scripts/prep-photo.swift`, macOS ImageIO), not in the
  Worker, so there is no Cloudflare Images cost or limit, and HEIC works.
- The frame refreshes the list hourly and keeps the last one, so with Wi-Fi down it keeps showing the
  photos it already has.
