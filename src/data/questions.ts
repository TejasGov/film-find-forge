export interface RankQuestion {
  id: string;
  prompt: string;
  hint: string;
  /** "rank" = order the options; "tags" = type free-text answers and add them. */
  kind?: "rank" | "tags";
  options: string[];
  placeholder?: string;
  suggestions?: string[];
}

export const RANK_QUESTIONS: RankQuestion[] = [
  { id: "mood", prompt: "What should tonight feel like?", hint: "Tap in order — favourite first.", options: ["Funny & light", "Edge-of-seat tense", "Moving & emotional", "Mind-bending", "Big epic adventure"] },
  {
    id: "language",
    kind: "tags",
    prompt: "Which languages work for you?",
    hint: "Type a language and press Add. Leave empty for any language.",
    options: [],
    placeholder: "e.g. English",
    suggestions: ["English", "Hindi", "Telugu", "Tamil", "French", "Spanish", "Korean", "Japanese"],
  },
  { id: "length", prompt: "How long can you sit?", hint: "Rank what works best.", options: ["Under 2 hours", "2 – 2½ hours", "Long is fine"] },
  { id: "era", prompt: "Which era calls to you?", hint: "Rank your favourite decades.", options: ["Golden classics (pre-1970)", "70s – 90s", "2000s", "2010s and newer"] },
  { id: "intensity", prompt: "How dark can it get?", hint: "Rank comfort level.", options: ["Family friendly", "A little edge", "Dark & intense"] },
];
