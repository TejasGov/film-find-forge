import local from "./movies.json" with { type: "json" };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OMDb's key is a public, client-visible key already used by the browser app.
const OMDB = "https://www.omdbapi.com/?apikey=2d39236c";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

type Member = { name: string; rankings: Record<string, string[]> };
type Q = { id: string; prompt: string; kind?: "rank" | "tags" };
type Film = Record<string, any> & { imdbID: string; Title: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const gatewayMsg = (status: number, fallback?: string) =>
  status === 402 ? "AI credits have run out. Add credits in your workspace to keep deciding."
  : status === 429 ? "Too many requests right now — try again in a moment."
  : fallback ?? "The decision service failed.";

// Step 1: ask a generative model to brainstorm real titles from the whole film catalogue
// that fit the group's consensus; OMDb then verifies each one exists.
async function brainstorm(key: string, consensus: unknown, languages: string[]): Promise<{ title: string; year: number }[]> {
  const res = await fetch(`${GATEWAY}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Lovable-API-Key": key,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions:
        "You suggest real, well-known feature films that exist on IMDb. Use exact original or common English release titles and the correct release year.",
      input: `A group is choosing a movie. Answers with higher support matter more:\n${JSON.stringify(consensus)}\n` +
        (languages.length
          ? `Languages requested (the film's original language should be one of these; spread suggestions across them): ${languages.join(", ")}.\n`
          : "Any language is fine.\n") +
        "Suggest 24 diverse films that fit well. Avoid obscure titles.",
      text: {
        format: {
          type: "json_schema",
          name: "films",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["films"],
            properties: {
              films: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "year"],
                  properties: { title: { type: "string" }, year: { type: "integer" } },
                },
              },
            },
          },
        },
      },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new GatewayError(res.status, gatewayMsg(res.status, body?.error?.message));
  }
  // Read the SSE stream and collect the output text.
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "", text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const l of lines) {
      if (!l.startsWith("data:")) continue;
      const d = l.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") text += ev.delta;
        if (ev.type === "response.failed" || ev.type === "error") throw new GatewayError(502, "Suggestion step failed.");
      } catch (e) { if (e instanceof GatewayError) throw e; }
    }
  }
  try { return JSON.parse(text).films ?? []; } catch { return []; }
}

async function omdb(title: string, year: number): Promise<Film | null> {
  const get = async (q: string) => {
    const r = await fetch(`${OMDB}&type=movie&t=${encodeURIComponent(title)}${q}`);
    const d = await r.json().catch(() => null);
    return d?.Response === "True" && d.Poster && d.Poster !== "N/A" ? d : null;
  };
  return (await get(`&y=${year}`)) ?? (await get(""));
}

const speaks = (m: Film, langs: string[]) =>
  !langs.length || langs.some((l) => String(m.Language ?? "").toLowerCase().split(", ")[0].includes(l));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { members, questions } = (await req.json()) as { members: Member[]; questions: Q[] };
    if (!Array.isArray(members) || members.length === 0 || members.length > 12) return json({ error: "Add between 1 and 12 people." }, 400);
    if (!Array.isArray(questions) || questions.length > 10) return json({ error: "Invalid questions." }, 400);
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "AI is not configured." }, 500);

    // Borda count for ranked questions; tally mentions for free-text tag questions.
    const consensus: Record<string, { prompt: string; ranking: { answer: string; support: number }[] }> = {};
    const languages = new Set<string>();
    for (const q of questions) {
      const pts: Record<string, number> = {};
      if (q.kind === "tags") {
        for (const m of members) {
          for (const raw of (m.rankings[q.id] ?? []).slice(0, 10)) {
            const t = String(raw).trim().toLowerCase().slice(0, 30);
            if (!t) continue;
            pts[t] = (pts[t] ?? 0) + 1;
            languages.add(t);
          }
        }
        consensus[q.id] = {
          prompt: q.prompt,
          ranking: Object.entries(pts).sort((a, b) => b[1] - a[1])
            .map(([answer, p]) => ({ answer, support: Math.round((p / members.length) * 100) / 100 })),
        };
        continue;
      }
      let max = 0;
      for (const m of members) {
        const order = m.rankings[q.id] ?? [];
        max = Math.max(max, order.length - 1);
        order.forEach((a, i) => (pts[a] = (pts[a] ?? 0) + (order.length - 1 - i)));
      }
      const denom = Math.max(1, max * members.length);
      consensus[q.id] = {
        prompt: q.prompt,
        ranking: Object.entries(pts).sort((a, b) => b[1] - a[1])
          .map(([answer, p]) => ({ answer, support: Math.round((p / denom) * 100) / 100 })),
      };
    }
    const langs = [...languages];

    // Candidates: films found on OMDb from the brainstorm, plus matching films from our wall.
    const ideas = await brainstorm(key, consensus, langs);
    const found = (await Promise.all(ideas.slice(0, 24).map((f) => omdb(f.title, f.year).catch(() => null)))).filter(Boolean) as Film[];
    const pool = new Map<string, Film>();
    for (const f of found) pool.set(f.imdbID, f);
    for (const f of (local as Film[]).filter((m) => speaks(m, langs))) if (pool.size < 60) pool.set(f.imdbID, f);
    if (pool.size < 3) for (const f of local as Film[]) if (pool.size < 40) pool.set(f.imdbID, f);

    const criteria: Record<string, string> = {};
    for (const m of pool.values()) {
      criteria[m.imdbID] = `${m.Title} (${m.Year}) · ${m.Genre} · ${m.Runtime} · rated ${m.Rated} · language ${m.Language} · IMDb ${m.imdbRating} · ${m.Plot}`;
    }

    // Step 2: Jev makes the actual decision over every verified candidate.
    const res = await fetch(`${GATEWAY}/systemone`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "typesafe/jev-latest",
        state: {
          group: {
            size: members.length,
            consensus,
            members: members.map((m) => ({ name: m.name, rankings: m.rankings })),
          },
        },
        questions: {
          pick: {
            type: "choice",
            instructions: {
              question:
                "Which single film should this group watch tonight? Pick the candidate that best matches the answers with the highest support in `group.consensus` (mood, language, length, era, intensity), and that avoids anything a member in `group.members` ranked last.",
              note: "Language, runtime and era are practical constraints; weigh them heavily when strongly supported. A film's first listed language is its original language.",
            },
            criteria,
          },
        },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json({ error: gatewayMsg(res.status, data?.error?.message) }, res.status);
    const ans = data?.answers?.pick;
    if (!ans?.probabilities) return json({ error: "No decision was returned." }, 502);

    const picks = Object.entries(ans.probabilities as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, p]) => ({ movie: pool.get(id), probability: p }))
      .filter((p) => p.movie);

    return json({ picks, confidence: ans.confidence ?? null, consensus, candidates: pool.size, fromOmdb: found.length });
  } catch (e) {
    if (e instanceof GatewayError) return json({ error: e.message }, e.status);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
