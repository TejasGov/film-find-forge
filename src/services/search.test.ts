import { describe, expect, it } from "vitest";
import { matchScore, mergeCandidates, orderResults, normalize } from "./search";

const film = (imdbID: string, Title: string, imdbVotes = "0") =>
  ({ imdbID, Title, imdbVotes, Year: "", Poster: "x", imdbRating: "", Rated: "", Runtime: "", Genre: "", Plot: "", Actors: "" });

describe("search ranking", () => {
  it("partial words match: 'endga' matches Avengers: Endgame", () => {
    expect(matchScore("endga", "Avengers: Endgame")).toBe(1);
  });

  it("accents and punctuation are ignored", () => {
    expect(normalize("Amélie!")).toBe("amelie");
  });

  it("IMDb popularity order stays at the top, ahead of OMDb-only hits", () => {
    const ordered = orderResults(
      "endgame",
      [film("tt2", "Endgame", "900"), film("tt1", "Avengers: Endgame", "1,300,000")],
      ["tt1"],
    );
    expect(ordered.map((m) => m.imdbID)).toEqual(["tt1", "tt2"]);
  });

  it("without IMDb order, more-voted films come first among equal matches", () => {
    const ordered = orderResults("endgame", [film("a", "Endgame", "500"), film("b", "Endgame", "50,000")], []);
    expect(ordered.map((m) => m.imdbID)).toEqual(["b", "a"]);
  });

  it("the same film from both sources appears once", () => {
    const merged = mergeCandidates(
      [{ id: "tt1", title: "A", year: 2020, source: "imdb" }],
      [{ id: "tt1", title: "A", year: 2020, source: "omdb" }, { id: "tt2", title: "B", year: 2021, source: "omdb" }],
    );
    expect(merged.map((c) => c.id)).toEqual(["tt1", "tt2"]);
  });
});
