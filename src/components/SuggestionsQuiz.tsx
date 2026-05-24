import { useState } from "react";

interface QuizQuestion {
  id: string;
  category: string;
  options: string[];
}

interface SuggestionsQuizProps {
  onClose: () => void;
  onSubmit: (answers: Record<string, string>) => void;
}

const quizQuestions: QuizQuestion[] = [
  { id: "genre", category: "What genre do you prefer?", options: ["Action", "Drama", "Comedy", "Thriller", "Sci-Fi", "Romance"] },
  { id: "mood", category: "What mood are you in?", options: ["Feel-Good", "Intense", "Thought-Provoking", "Scary", "Romantic"] },
  { id: "duration", category: "How long are you willing to watch?", options: ["Short (<90 min)", "Medium (90-150 min)", "Long (>150 min)"] },
  { id: "era", category: "What era of movies do you prefer?", options: ["Classic (Pre-2000)", "2000s", "2010s", "2020s", "Any Era"] },
  { id: "language", category: "What language/region?", options: ["Hollywood", "Bollywood", "Spanish", "International", "Any"] },
  { id: "pace", category: "What's your preferred pace?", options: ["Slow & Thoughtful", "Balanced", "Fast & Action-Packed"] },
  { id: "rating", category: "Content rating preference?", options: ["G/PG (Family-Friendly)", "PG-13", "R (Mature)", "No Preference"] },
  { id: "setting", category: "Preferred setting?", options: ["Present Day", "Historical", "Fantasy/Sci-Fi World", "Mixed"] },
  { id: "themes", category: "What themes interest you?", options: ["Adventure", "Mystery", "Coming-of-Age", "Social Issues", "Supernatural", "Other"] },
  { id: "protagonist", category: "Protagonist type?", options: ["Hero/Protagonist", "Anti-Hero", "Ensemble Cast", "No Preference"] },
];

export const SuggestionsQuiz = ({ onClose, onSubmit }: SuggestionsQuizProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isAnswered = answers[currentQuestion.id] !== undefined;
  const isComplete = Object.keys(answers).length === quizQuestions.length;
  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

  const handleSelectAnswer = (option: string) => setAnswers({ ...answers, [currentQuestion.id]: option });
  const handleNext = () => { if (currentQuestionIndex < quizQuestions.length - 1) setCurrentQuestionIndex(i => i + 1); };
  const handlePrevious = () => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(i => i - 1); };
  const handleSubmit = () => { if (isComplete) onSubmit(answers); };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-card max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Progress bar */}
        <div className="h-0.5 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <div className="mb-7">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              {currentQuestionIndex + 1} of {quizQuestions.length}
            </p>
            <h2 className="text-2xl font-black tracking-tight">What Should You Watch?</h2>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground/70 mb-4">{currentQuestion.category}</p>
            <div className="grid grid-cols-2 gap-2">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelectAnswer(option)}
                  className={`px-4 py-3.5 rounded-xl text-sm font-medium text-left transition-all ${
                    answers[currentQuestion.id] === option
                      ? "bg-primary/15 border-2 border-primary text-foreground"
                      : "bg-secondary/50 border-2 border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg disabled:opacity-30"
            >
              ← Back
            </button>
          </div>

          {!isComplete ? (
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className="bg-primary hover:bg-primary/90 disabled:opacity-30 text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-full transition-all"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-green-500 hover:bg-green-400 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all"
            >
              Get Recommendations
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
