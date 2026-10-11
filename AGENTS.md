# Project rules

- The landing poster wall and group decision use a static movie dataset (`src/data/movies.json`, mirrored in `supabase/functions/decide/movies.json`); keep both copies in sync — avoids 150 API calls per visit and lets the decision function judge the same films.
- Group decisions run in the `decide` backend function: code does Borda-count aggregation of each person's rankings, a generative model brainstorms titles that are verified on OMDb (merged with matching wall films), then Jev (`typesafe/jev-latest`, choice over candidate IDs) picks the film — OMDb has no discovery endpoint, and this keeps the AI key server-side and the policy explicit.
- Loading-screen facts are a static tagged list (`src/data/facts.ts`) matched to quiz answers in the browser — no AI cost per wait.
- The poster canvas animates via direct DOM transforms in a requestAnimationFrame loop, not React state — keeps panning at 60fps.
