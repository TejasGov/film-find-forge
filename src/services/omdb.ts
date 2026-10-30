import { OMDB_API_KEY } from "@/lib/config";
import type { Movie } from "@/types/movie";

const BASE = "https://www.omdbapi.com";

export async function fetchMovieByTitle(title: string): Promise<Movie | null> {
  const res = await fetch(`${BASE}/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`);
  const data = await res.json();
  return data.Response === "True" ? data : null;
}

export async function fetchMovieById(id: string): Promise<Movie> {
  const res = await fetch(`${BASE}/?i=${id}&apikey=${OMDB_API_KEY}`);
  return res.json();
}

export async function fetchMoviesByTerms(terms: string[]): Promise<Movie[]> {
  const movies: Movie[] = [];
  for (const term of terms) {
    if (movies.length >= 10) break;
    const searchRes = await fetch(`${BASE}/?s=${encodeURIComponent(term)}&type=movie&apikey=${OMDB_API_KEY}`);
    const searchData = await searchRes.json();
    if (searchData.Search?.length > 0) {
      const detailRes = await fetch(`${BASE}/?i=${searchData.Search[0].imdbID}&apikey=${OMDB_API_KEY}`);
      const detail = await detailRes.json();
      if (detail.Poster && detail.Poster !== "N/A") movies.push(detail);
    }
  }
  return movies;
}

type Hit = { Title: string; Year: string; imdbID: string; Poster: string };

// Exact title matches first, then titles that start with the query, then newest first.
export function rankHits(query: string, hits: Hit[]): Hit[] {
  const q = query.trim().toLowerCase();
  const score = (t: string) => {
    const s = t.toLowerCase();
    return s === q ? 3 : s.startsWith(q) ? 2 : s.includes(q) ? 1 : 0;
  };
  const year = (y: string) => parseInt(y, 10) || 0;
  return [...hits].sort((a, b) => score(b.Title) - score(a.Title) || year(b.Year) - year(a.Year));
}

export async function searchMoviesLive(query: string): Promise<Movie[]> {
  // OMDb returns 10 results per page in no useful order, so popular new films
  // (e.g. "Ramayana" 2026) can sit on page 2. Fetch the first 3 pages and rank them ourselves.
  const q = encodeURIComponent(query.trim());
  const pages = await Promise.all(
    [1, 2, 3].map((p) =>
      fetch(`${BASE}/?s=${q}&type=movie&page=${p}&apikey=${OMDB_API_KEY}`)
        .then((r) => r.json())
        .catch(() => null),
    ),
  );
  const seen = new Set<string>();
  const hits: Hit[] = [];
  for (const d of pages) {
    for (const m of (d?.Search ?? []) as Hit[]) {
      if (seen.has(m.imdbID) || !m.Poster || m.Poster === "N/A") continue;
      seen.add(m.imdbID);
      hits.push(m);
    }
  }
  const top = rankHits(query, hits).slice(0, 15);
  const detailed = await Promise.all(
    top.map((m) => fetch(`${BASE}/?i=${m.imdbID}&apikey=${OMDB_API_KEY}`).then((r) => r.json()).catch(() => null)),
  );
  return detailed.filter((d) => d && d.Response === "True" && d.Poster && d.Poster !== "N/A");
}
