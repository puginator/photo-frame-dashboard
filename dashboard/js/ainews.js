// AI headlines from Hacker News (Algolia API). Shared by worker.js and tests.
// HN has no summaries, so v1 is display-only: title + points + comments + age.
const AI_RE = /\b(ai\b|a\.i\.|llm|gpt|claude|openai|anthropic|gemini|deepseek|mistral|llama|copilot|chatbot|agent(s|ic)?|transformer|diffusion|nvidia|cuda|huggingface|machine.learning|neural|genai)\b/i;

// Algolia hit -> compact story. Returns null when unusable.
export function toStory(h) {
  if (!h || !h.title || !h.objectID) return null;
  let host = '';
  try { host = h.url ? new URL(h.url).hostname.replace(/^www\./, '') : ''; } catch (e) {}
  return {
    id: String(h.objectID),
    title: h.title,
    url: h.url || ('https://news.ycombinator.com/item?id=' + h.objectID),
    points: h.points || 0,
    comments: h.num_comments || 0,
    at: (h.created_at_i || 0) * 1000,
    host,
  };
}

// Merge front-page + search hits: keep AI-matching stories, dedupe, top N by points.
export function pickStories(hits, limit) {
  const seen = new Set();
  return hits
    .map(toStory)
    .filter((s) => s && !seen.has(s.id) && seen.add(s.id))
    .filter((s) => AI_RE.test(s.title))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit || 10);
}

export function ageString(at, now) {
  const h = Math.max(0, Math.round((now - at) / 36e5));
  if (h < 1) return 'just now';
  if (h < 24) return h + 'h ago';
  const d = Math.round(h / 24);
  return d + 'd ago';
}
