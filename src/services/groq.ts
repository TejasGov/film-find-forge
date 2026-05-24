import { GROQ_API_KEY } from "@/lib/config";

export async function getMovieSuggestions(answers: Record<string, string>): Promise<string[]> {
  const prompt = `Based on these user preferences, recommend exactly 3 specific movie titles (not franchises, just movie names). Return ONLY the movie titles, one per line, with nothing else.

User Preferences:
- Genre: ${answers.genre || "Any"}
- Mood: ${answers.mood || "Any"}
- Duration: ${answers.duration || "Any"}
- Era: ${answers.era || "Any"}
- Language/Region: ${answers.language || "Any"}
- Pace: ${answers.pace || "Any"}
- Content Rating: ${answers.rating || "Any"}
- Setting: ${answers.setting || "Any"}
- Themes: ${answers.themes || "Any"}
- Protagonist: ${answers.protagonist || "Any"}

Return 3 movie titles, one per line:`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq API error");
  if (!data.choices?.[0]?.message?.content) throw new Error("Invalid response from AI");

  return data.choices[0].message.content
    .split("\n")
    .map((t: string) => t.trim())
    .filter((t: string) => t.length > 0)
    .slice(0, 3);
}

export async function getTrendingMovies(region: string = "Hollywood"): Promise<string[]> {
  const prompt = `You are a movie recommendation engine. Provide exactly 10 currently popular or trending movies from ${region} cinema. 
Return ONLY the movie titles, one per line, with absolutely no numbering, bullet points, introductory text, or release years.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq API error");
  if (!data.choices?.[0]?.message?.content) throw new Error("Invalid response from AI");

  return data.choices[0].message.content
    .split("\n")
    .map((t: string) => t.trim().replace(/^\d+[\.\)]\s*/, '')) // extra safety against numbering
    .filter((t: string) => t.length > 0)
    .slice(0, 10);
}
