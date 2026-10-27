// Export The Wonder Desk's lesson text for the Print tab's reading panel (docs/printables.md).
// Run from a daily-spark checkout (it resolves the catalog's @/ imports):
//   cd ../daily-spark && npx tsx <this file> <out dir>
// then upload each <topic>.json to wonder-desk/reading/cozy-v1/:
//   for f in <out dir>/*.json; do npx wrangler r2 object put "wonder-desk/reading/cozy-v1/$(basename $f)" \
//     --remote --file "$f" --content-type application/json; done
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
if (!out) { console.error('usage: npx tsx export-wonder-reading.mjs <out dir>'); process.exit(1); }
const { listCatalogLessons, getCatalogLesson } = await import(path.join(process.cwd(), 'lib/catalog/index.ts'));

const AGES = { early: 8, middle: 10, teen: 13 };
const topics = [...new Set(listCatalogLessons().map((l) => l.topicId))].sort();
fs.mkdirSync(out, { recursive: true });
for (const topic of topics) {
  const doc = {};
  for (const [band, age] of Object.entries(AGES)) {
    const l = getCatalogLesson(topic, age); // falls back to the nearest authored band
    const s = l.spec;
    doc[band] = {
      title: s.title, kicker: s.kicker,
      headline: s.article.headline, body: s.article.body, factBox: s.article.factBox,
      facts: s.facts, tryThis: s.tryThis, mission: s.mission, joke: s.joke, riddle: s.riddle,
    };
  }
  fs.writeFileSync(path.join(out, topic + '.json'), JSON.stringify(doc));
}
console.log(topics.length + ' topics -> ' + out);
