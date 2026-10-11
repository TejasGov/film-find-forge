import { useEffect, useRef, useState } from "react";
import { factsFor } from "@/data/facts";
import { X, Plus, ArrowRight, ArrowLeft, RotateCcw, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RANK_QUESTIONS } from "@/data/questions";
import { useLenis } from "@/hooks/use-lenis";
import type { Movie } from "@/types/movie";

interface Props {
  movies: Movie[];
  onClose: () => void;
  onTrailer: (m: Movie) => void;
  onAdd: (m: Movie) => void;
}

type Phase = "crew" | "rank" | "deciding" | "result";
type Rankings = Record<string, string[]>;

export const MovieNight = ({ movies, onClose, onTrailer, onAdd }: Props) => {
  const [phase, setPhase] = useState<Phase>("crew");
  const [names, setNames] = useState<string[]>(["", ""]);
  const [person, setPerson] = useState(0);
  const [qi, setQi] = useState(0);
  const [all, setAll] = useState<Rankings[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [picks, setPicks] = useState<{ movie: Movie; probability: number }[]>([]);

  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLenis(wrap, inner);

  const crew = names.map((n, i) => n.trim() || `Person ${i + 1}`);
  const q = RANK_QUESTIONS[qi];
  const current = all[person]?.[q?.id] ?? [];
  const isTags = q?.kind === "tags";
  const [draft, setDraft] = useState("");
  const [facts, setFacts] = useState<string[]>([]);
  const [fi, setFi] = useState(0);
  useEffect(() => {
    if (phase !== "deciding" || facts.length < 2) return;
    const t = setInterval(() => setFi((i) => (i + 1) % facts.length), 5500);
    return () => clearInterval(t);
  }, [phase, facts.length]);

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ").slice(0, 30);
    if (!t || current.some((c) => c.toLowerCase() === t.toLowerCase()) || current.length >= 6) return setDraft("");
    setAll((prev) => {
      const next = [...prev];
      next[person] = { ...(next[person] ?? {}), [q.id]: [...current, t[0].toUpperCase() + t.slice(1)] };
      return next;
    });
    setDraft("");
  };
  const removeTag = (t: string) =>
    setAll((prev) => {
      const next = [...prev];
      next[person] = { ...(next[person] ?? {}), [q.id]: current.filter((c) => c !== t) };
      return next;
    });

  const setOrder = (order: string[]) => {
    // auto-place the final remaining option
    if (order.length === q.options.length - 1) order = [...order, q.options.find((o) => !order.includes(o))!];
    setAll((prev) => {
      const next = [...prev];
      next[person] = { ...(next[person] ?? {}), [q.id]: order };
      return next;
    });
  };
  const tap = (o: string) => setOrder(current.includes(o) ? current.filter((x) => x !== o) : [...current, o]);

  const decide = async (rankings: Rankings[]) => {
    setPhase("deciding");
    setError(null);
    setFacts(factsFor(rankings));
    setFi(0);
    const { data, error } = await supabase.functions.invoke("decide", {
      body: {
        members: crew.map((name, i) => ({ name, rankings: rankings[i] })),
        questions: RANK_QUESTIONS.map(({ id, prompt, kind }) => ({ id, prompt, kind: kind ?? "rank" })),
      },
    });
    let msg = data?.error as string | undefined;
    if (error) {
      try {
        msg = (await (error as any).context?.json())?.error ?? error.message;
      } catch {
        msg = error.message;
      }
    }
    if (msg || !data?.picks) {
      setError(msg ?? "Something went wrong.");
      setPhase("rank");
      return;
    }
    setPicks(
      (data.picks as { movie: Movie; probability: number }[]).filter((p) => p.movie),
    );
    setPhase("result");
  };

  const next = () => {
    if (isTags && draft.trim()) addTag(draft);
    setDraft("");
    if (qi < RANK_QUESTIONS.length - 1) return setQi(qi + 1);
    if (person < crew.length - 1) {
      setPerson(person + 1);
      setQi(0);
      return;
    }
    decide(all);
  };
  const back = () => {
    if (qi > 0) return setQi(qi - 1);
    if (person > 0) {
      setPerson(person - 1);
      setQi(RANK_QUESTIONS.length - 1);
    } else setPhase("crew");
  };

  const reset = () => {
    setAll([]);
    setPerson(0);
    setQi(0);
    setPicks([]);
    setPhase("crew");
  };

  const totalSteps = crew.length * RANK_QUESTIONS.length;
  const step = person * RANK_QUESTIONS.length + qi + 1;

  return (
    <div className="fixed inset-0 z-50 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-2xl" />
      <div ref={wrap} className="relative h-full overflow-y-auto">
        <div ref={inner} className="mx-auto flex min-h-full max-w-3xl flex-col px-6 py-8">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Movie night</span>
            <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {phase === "crew" && (
            <section key="crew" className="my-auto py-16 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <h2 className="font-display text-6xl leading-[0.95] md:text-7xl">Who's watching?</h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Everyone answers five quick questions. We weigh every answer and find the one film you'll all enjoy.
              </p>
              <div className="mt-10 space-y-3">
                {names.map((n, i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-border pb-3">
                    <span className="w-6 font-display text-xl text-primary">{i + 1}</span>
                    <input
                      value={n}
                      autoFocus={i === 0}
                      onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={`Person ${i + 1}`}
                      className="flex-1 bg-transparent text-xl outline-none placeholder:text-muted-foreground/50"
                    />
                    {names.length > 1 && (
                      <button onClick={() => setNames(names.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground" aria-label="Remove person">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between">
                {names.length < 8 ? (
                  <button onClick={() => setNames([...names, ""])} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Plus className="h-4 w-4" /> Add someone
                  </button>
                ) : <span />}
                <button onClick={() => setPhase("rank")} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110">
                  Begin <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {phase === "rank" && q && (
            <section key={`${person}-${qi}`} className="my-auto py-12 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10 h-px w-full bg-border">
                <div className="h-px bg-primary transition-all duration-700 ease-out" style={{ width: `${(step / totalSteps) * 100}%` }} />
              </div>
              <p className="text-sm text-primary">
                {crew[person]}'s turn · {qi + 1}/{RANK_QUESTIONS.length}
              </p>
              <h2 className="mt-3 font-display text-5xl leading-[1] md:text-6xl">{q.prompt}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{q.hint}</p>
              {isTags ? (
                <div className="mt-10">
                  <form
                    onSubmit={(e) => { e.preventDefault(); addTag(draft); }}
                    className="flex items-center gap-3 border-b border-border pb-3 focus-within:border-primary/60"
                  >
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={q.placeholder}
                      aria-label="Language"
                      className="flex-1 bg-transparent font-display text-3xl outline-none placeholder:text-muted-foreground/40"
                    />
                    <button type="submit" disabled={!draft.trim()} className="inline-flex items-center gap-2 border border-foreground/15 px-4 py-2 text-sm transition hover:border-primary/60 disabled:opacity-30">
                      <Plus className="h-4 w-4" /> Add
                    </button>
                  </form>
                  <div className="mt-5 flex min-h-10 flex-wrap gap-2">
                    {current.length === 0 && <span className="text-sm text-muted-foreground">No languages yet — any language is fine.</span>}
                    {current.map((t) => (
                      <span key={t} className="inline-flex items-center gap-2 border border-primary/60 bg-primary/10 py-1.5 pl-3 pr-2 text-sm animate-in zoom-in-95">
                        {t}
                        <button onClick={() => removeTag(t)} aria-label={`Remove ${t}`} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-2">
                    {q.suggestions?.filter((sug) => !current.includes(sug)).map((sug) => (
                      <button key={sug} onClick={() => addTag(sug)} className="border border-dashed border-foreground/20 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-foreground/40 hover:text-foreground">
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
              <div className="mt-10 grid gap-2.5">
                {q.options.map((o) => {
                  const rank = current.indexOf(o);
                  const on = rank >= 0;
                  return (
                    <button
                      key={o}
                      onClick={() => tap(o)}
                      className={`group flex items-center gap-5 rounded-xl border px-5 py-4 text-left transition-all duration-300 ${
                        on ? "border-primary/60 bg-primary/10" : "border-border hover:border-foreground/30 hover:bg-secondary/60"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-lg transition-all duration-300 ${
                          on ? "scale-100 bg-primary text-primary-foreground" : "scale-90 border border-dashed border-muted-foreground/40 text-transparent"
                        }`}
                      >
                        {on ? rank + 1 : "·"}
                      </span>
                      <span className="text-lg">{o}</span>
                    </button>
                  );
                })}
              </div>
              )}
              {error && <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
              <div className="mt-10 flex items-center justify-between">
                <button onClick={back} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-4">
                  {current.length > 0 && !isTags && (
                    <button onClick={() => setOrder([])} className="text-sm text-muted-foreground hover:text-foreground">Clear</button>
                  )}
                  <button
                    onClick={next}
                    disabled={!isTags && current.length !== q.options.length}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-30"
                  >
                    {step === totalSteps ? "Decide" : person < crew.length - 1 && qi === RANK_QUESTIONS.length - 1 ? `Pass to ${crew[person + 1]}` : "Next"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {phase === "deciding" && (
            <section className="my-auto flex flex-col items-center py-24 text-center animate-in fade-in duration-700">
              <div className="relative h-40 w-28">
                {movies.slice(0, 5).map((m, i) => (
                  <img
                    key={m.imdbID}
                    src={m.Poster}
                    alt=""
                    className="absolute inset-0 h-full w-full rounded-md object-cover shadow-poster animate-shuffle"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </div>
              <h2 className="mt-10 font-display text-4xl">Weighing {crew.length} sets of taste…</h2>
              <p className="mt-2 text-sm text-muted-foreground">Searching the full OMDb catalogue, then Jev picks one.</p>
              {facts[fi] && (
                <div className="mt-12 max-w-lg border-t border-border pt-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">While you wait</p>
                  <p key={fi} className="mt-3 font-display text-2xl leading-snug animate-in fade-in slide-in-from-bottom-2 duration-700">{facts[fi]}</p>
                </div>
              )}
            </section>
          )}

          {phase === "result" && picks[0] && (
            <section className="py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Tonight you're watching</p>
              <div className="mt-6 grid gap-8 md:grid-cols-[260px_1fr]">
                <img src={picks[0].movie.Poster} alt={picks[0].movie.Title} className="w-full rounded-lg shadow-poster" />
                <div className="flex flex-col">
                  <h2 className="font-display text-6xl leading-[0.95]">{picks[0].movie.Title}</h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {picks[0].movie.Year} · {picks[0].movie.Runtime} · {picks[0].movie.Genre}
                  </p>
                  <p className="mt-5 leading-relaxed text-foreground/85">{picks[0].movie.Plot}</p>
                  <div className="mt-6">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-muted-foreground">Group match</span>
                      <span className="font-display text-2xl text-primary">{Math.round(picks[0].probability * 100)}%</span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-secondary">
                      <div className="h-1 rounded-full bg-primary transition-all duration-1000" style={{ width: `${Math.max(4, picks[0].probability * 100)}%` }} />
                    </div>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button onClick={() => onTrailer(picks[0].movie)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110">
                      <Play className="h-4 w-4 fill-current" /> Watch trailer
                    </button>
                    <button onClick={() => onAdd(picks[0].movie)} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary">
                      <Plus className="h-4 w-4" /> Save to list
                    </button>
                    <button onClick={reset} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-4 w-4" /> Start over
                    </button>
                  </div>
                </div>
              </div>

              {picks.length > 1 && (
                <div className="mt-16">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Also a strong fit</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {picks.slice(1).map((p) => (
                      <div key={p.movie.imdbID} className="flex gap-4 rounded-xl border border-border p-3">
                        <img src={p.movie.Poster} alt="" className="h-28 w-20 rounded object-cover" />
                        <div className="flex flex-col">
                          <span className="font-display text-2xl leading-tight">{p.movie.Title}</span>
                          <span className="mt-1 text-xs text-muted-foreground">{p.movie.Year} · {p.movie.Runtime}</span>
                          <span className="mt-auto text-sm text-primary">{Math.round(p.probability * 100)}% match</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
