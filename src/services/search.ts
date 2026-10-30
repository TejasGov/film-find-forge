import { OMDB_API_KEY } from "@/lib/config";
import type { Movie } from "@/types/movie";

/**
 * Search strategy
 * 1. IMDb's own suggestion feed (what imdb.com's search box uses): matches partial words
 *    ("endga" → Avengers: Endgame) and is already ordered by popularity.
 * 2. OMDb title search as a backup: only matches whole words and has no useful order.
 * 3. Full details for the top candidates come from OMDb by IMDb ID.
 * Final order: IMDb's popularity order first, then the rest by how well the title
 * matches and how many IMDb votes the film has.
 */

const OMDB = "https://www.omdbapi.com";
const SUGGEST = "https://v3.sg.media-imdb.com/suggestion/x";
const FILM_TYPES = new Set(["movie", "tvMovie"]);
const MAX_RESULTS = 15;

export type Candidate = { id: string; title: string; year: number | null; source: "imdb" | "omdb" };
type Detailed = Movie & { imdbVotes?: string; Response?: string };

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

/** 3 = exact title, 2 = title starts with query, 1 = a word starts with query / contains it, 0 = no match. */
export function matchScore(query: string, title: string): number {
  const q = normalize(query);
  const t = normalize(title);
  if (!q) return 0;
  if (t === q) return 3;
  if (t.startsWith(q)) return 2;
  if (t.split(" ").some((w) => w.startsWith(q)) || t.includes(q)) return 1;
  return 0;
}

export const votes = (m: { imdbVotes?: string }) => parseInt(String(m.imdbVotes ?? "").replace(/,/g, ""), 10) || 0;

/** Merge both sources without duplicates; IMDb suggestions keep their popularity order at the front. */
export function mergeCandidates(imdb: Candidate[], omdb: Candidate[], limit = MAX_RESULTS): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const c of [...imdb, ...omdb]) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out.slice(0, limit);
}

/** Final order: IMDb-suggested films by their position, then everything else by match quality, then votes. */
export function orderResults(query: string, films: Detailed[], imdbOrder: string[]): Detailed[] {
  const pos = new Map(imdbOrder.map((id, i) => [id, i]));
  return [...films].sort((a, b) => {
    const pa = pos.get(a.imdbID), pb = pos.get(b.imdbID);
    if (pa !== undefined && pb !== undefined) return pa - pb;
    if (pa !== undefined) return -1;
    if (pb !== undefined) return 1;
    return matchScore(query, b.Title) - matchScore(query, a.Title) || votes(b) - votes(a);
  });
}

async function imdbSuggestions(query: string, signal?: AbortSignal): Promise<Candidate[]> {
  const q = normalize(query);
  if (!q) return [];
  const res = await fetch(`${SUGGEST}/${encodeURIComponent(q)}.json?includeVideos=0`, { signal });
  if (!res.ok) throw new Error(`IMDb suggestions ${res.status}`);
  const data = await res.json();
  return ((data?.d ?? []) as any[])
    .filter((x) => typeof x?.id === "string" && x.id.startsWith("tt") && FILM_TYPES.has(x.qid))
    .map((x) => ({ id: x.id, title: String(x.l ?? ""), year: x.y ?? null, source: "imdb" as const }));
}

async function omdbSearch(query: string, pages: number[], signal?: AbortSignal): Promise<Candidate[]> {
  const q = encodeURIComponent(query.trim());
  const results = await Promise.all(
    pages.map((p) =>
      fetch(`${OMDB}/?s=${q}&type=movie&page=${p}&apikey=${OMDB_API_KEY}`, { signal })
        .then((r) => r.json())
        .catch(() => null),
    ),
  );
  return results.flatMap((d) =>
    ((d?.Search ?? []) as any[])
      .filter((m) => m.Poster && m.Poster !== "N/A")
      .map((m) => ({ id: m.imdbID, title: m.Title, year: parseInt(m.Year, 10) || null, source: "omdb" as const })),
  );
}

const detailCache = new Map<string, Promise<Detailed | null>>();
function details(id: string): Promise<Detailed | null> {
  if (!detailCache.has(id)) {
    const p = fetch(`${OMDB}/?i=${id}&apikey=${OMDB_API_KEY}`)
      .then((r) => r.json())
      .then((d) => (d?.Response === "True" ? d : null))
      .catch(() => {
        detailCache.delete(id); // let a later search retry
        return null;
      });
    detailCache.set(id, p);
  }
  return detailCache.get(id)!;
}

export async function searchMovies(query: string, signal?: AbortSignal): Promise<Movie[]> {
  const imdbP = imdbSuggestions(query, signal).catch(() => null);
  const omdbP = omdbSearch(query, [1], signal);
  const [imdb, omdbFirst] = await Promise.all([imdbP, omdbP]);
  // If IMDb's feed is unavailable, read more OMDb pages to make up for it.
  const omdb = imdb ? omdbFirst : [...omdbFirst, ...(await omdbSearch(query, [2, 3], signal))];
  const picks = mergeCandidates(imdb ?? [], omdb);
  const detailed = (await Promise.all(picks.map((c) => details(c.id)))).filter(
    (d): d is Detailed => !!d && !!d.Poster && d.Poster !== "N/A",
  );
  return orderResults(query, detailed, (imdb ?? []).map((c) => c.id));
}
