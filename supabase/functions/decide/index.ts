import movies from "./movies.json" with { type: "json" };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Member = { name: string; rankings: Record<string, string[]> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { members, questions } = (await req.json()) as {
      members: Member[];
      questions: { id: string; prompt: string }[];
    };
    if (!Array.isArray(members) || members.length === 0) return json({ error: "Add at least one person." }, 400);

    // Borda count per question: top rank earns the most points.
    const consensus: Record<string, { prompt: string; ranking: { answer: string; support: number }[] }> = {};
    for (const q of questions) {
      const pts: Record<string, number> = {};
      let max = 0;
      for (const m of members) {
        const order = m.rankings[q.id] ?? [];
        max = Math.max(max, order.length - 1);
        order.forEach((a, i) => (pts[a] = (pts[a] ?? 0) + (order.length - 1 - i)));
      }
      const denom = Math.max(1, max * members.length);
      consensus[q.id] = {
        prompt: q.prompt,
        ranking: Object.entries(pts)
          .sort((a, b) => b[1] - a[1])
          .map(([answer, p]) => ({ answer, support: Math.round((p / denom) * 100) / 100 })),
      };
    }

    const criteria: Record<string, string> = {};
    for (const m of movies as any[]) {
      criteria[m.imdbID] = `${m.Title} (${m.Year}) · ${m.Genre} · ${m.Runtime} · rated ${m.Rated} · ${m.Language} · ${m.Plot}`;
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/systemone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
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
                "Which single film should this group watch tonight? Pick the candidate that best matches the answers with the highest support in `group.consensus` across mood, pace, length, era and intensity, and that avoids anything a member in `group.members` ranked last.",
              note: "Runtime and era preferences are practical constraints; weigh them heavily when strongly supported.",
            },
            criteria,
          },
        },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        res.status === 402
          ? "AI credits have run out. Add credits in your workspace to keep deciding."
          : res.status === 429
            ? "Too many requests right now — try again in a moment."
            : data?.error?.message ?? "The decision service failed.";
      return json({ error: msg }, res.status);
    }
    const ans = data?.answers?.pick;
    if (!ans?.probabilities) return json({ error: "No decision was returned." }, 502);

    const ranked = Object.entries(ans.probabilities as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, p]) => ({ id, probability: p }));

    return json({ picks: ranked, confidence: ans.confidence ?? null, consensus });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
