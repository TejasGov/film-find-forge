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

// Live search lives in ./search.ts.
