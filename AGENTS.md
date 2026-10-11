# Project rules

- The landing poster wall and group decision use a static movie dataset (`src/data/top100.json`, mirrored in `supabase/functions/decide/movies.json`); keep both copies in sync — avoids 100 API calls per visit and lets the decision function judge the same films.
- Group decisions run in the `decide` backend function: code does Borda-count aggregation of each person's rankings, then Jev (`typesafe/jev-latest`, choice over candidate IDs) picks the film — keeps the AI key server-side and the policy explicit.
- The poster canvas animates via direct DOM transforms in a requestAnimationFrame loop, not React state — keeps panning at 60fps.
