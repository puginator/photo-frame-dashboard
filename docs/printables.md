# Printables

The **Print** tab sends today's Wonder Desk printable to the home printer by
email-print (HP ePrint, Epson Email Print, Canon and others give the printer its
own address).

- One topic a day, the same for everyone,
  walking the whole catalog. Each girl's chip picks her default reading band
  (`PRINTABLES.kids[].born` in `js/config.js`), and the band pills switch it
  (7–9, 10–12, 13–15). The Worker reads the finished PDF straight from the Wonder
  Desk's private R2 bucket (`wonder-desk/packs/cozy-v1/<topic>-<band>.pdf`,
  binding `WONDER`), so no Wonder Desk login or API is involved. The cover art
  on the frame comes from the Wonder Desk's public `/art/cozy-v1/<topic>.png`.

## Setup

Email Sending to arbitrary addresses needs the Workers Paid plan.

1. Turn on Email Sending for the sending domain: `npx wrangler email sending enable numberswarm.com`.
   It publishes its own records on `cf-bounce.<domain>` plus `_dmarc`, so the root SPF is untouched.
   Sends fail with `sending_not_ready` until Cloudflare has verified them (a few minutes).
   The wrangler login needs the `email_sending:write` scope.
2. Set the secrets:
   ```sh
   npx wrangler secret put PRINTER_EMAIL   # the printer's ePrint address
   npx wrangler secret put PRINT_FROM      # e.g. frame@numberswarm.com
   ```
3. Test the path without the frame:
   `npx wrangler email sending send --from <PRINT_FROM> --to <PRINTER_EMAIL> --subject Test --text Hi`
4. `npm run deploy`.

Until both secrets are set, the Print tab shows "Printer isn't set up yet". Older HP ePrint
printers (like the OfficeJet 3830) have no allowed-senders list and accept mail from anyone.

## Limits

- 10 prints a day (`PRINTS_PER_DAY` in `worker.js`), so a
  tap-happy kid can't empty the tray.
- The PDF email's body is a single space. Some email-print services still print
  a cover page for the body; check your printer's settings if one appears.
- Packs are around 3.5 MB each. HP ePrint caps an email at 10 MB.
- Topic titles come from the topic id ("ant-tunnels" becomes "Ant Tunnels"), not
  the Wonder Desk's per-band lesson titles.
