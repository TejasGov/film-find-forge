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

export async function searchMoviesLive(query: string): Promise<Movie[]> {
  // Append a wildcard to allow partial matches (e.g. "dilwal" -> "dilwal*")
  const searchQuery = query.trim() + '*';
  const res = await fetch(`${BASE}/?s=${encodeURIComponent(searchQuery)}&type=movie&apikey=${OMDB_API_KEY}`);
  const data = await res.json();
  if (data.Response === "True" && data.Search) {
    // Only take top 10 to avoid too many requests
    const basicResults = data.Search.slice(0, 10);
    // Fetch details for each to get accurate poster/rating/plot for the cards
    const detailedPromises = basicResults.map(async (m: any) => {
      const detailRes = await fetch(`${BASE}/?i=${m.imdbID}&apikey=${OMDB_API_KEY}`);
      return detailRes.json();
    });
    const detailedResults = await Promise.all(detailedPromises);
    return detailedResults.filter(detail => detail.Poster && detail.Poster !== "N/A");
  }
  return [];
}
