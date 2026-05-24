import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  {
    id: "genre",
    category: "What genre do you prefer?",
    options: ["Action", "Drama", "Comedy", "Thriller", "Sci-Fi", "Romance"],
  },
  {
    id: "mood",
    category: "What mood are you in?",
    options: ["Feel-Good", "Intense", "Thought-Provoking", "Scary", "Romantic"],
  },
  {
    id: "duration",
    category: "How long are you willing to watch?",
    options: ["Short (<90 min)", "Medium (90-150 min)", "Long (>150 min)"],
  },
  {
    id: "era",
    category: "What era of movies do you prefer?",
    options: ["Classic (Pre-2000)", "2000s", "2010s", "2020s", "Any Era"],
  },
  {
    id: "language",
    category: "What language/region?",
    options: ["Hollywood", "Bollywood", "Spanish", "International", "Any"],
  },
  {
    id: "pace",
    category: "What's your preferred pace?",
    options: ["Slow & Thoughtful", "Balanced", "Fast & Action-Packed"],
  },
  {
    id: "rating",
    category: "Content rating preference?",
    options: ["G/PG (Family-Friendly)", "PG-13", "R (Mature)", "No Preference"],
  },
  {
    id: "setting",
    category: "Preferred setting?",
    options: ["Present Day", "Historical", "Fantasy/Sci-Fi World", "Mixed"],
  },
  {
    id: "themes",
    category: "What themes interest you?",
    options: ["Adventure", "Mystery", "Coming-of-Age", "Social Issues", "Supernatural", "Other"],
  },
  {
    id: "protagonist",
    category: "Protagonist type?",
    options: ["Hero/Protagonist", "Anti-Hero", "Ensemble Cast", "No Preference"],
  },
];

export const SuggestionsQuiz = ({ onClose, onSubmit }: SuggestionsQuizProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isAnswered = answers[currentQuestion.id] !== undefined;
  const isComplete = Object.keys(answers).length === quizQuestions.length;

  const handleSelectAnswer = (option: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: option,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    if (isComplete) {
      onSubmit(answers);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">What Should You Watch?</h2>
          <p className="text-muted-foreground">
            Answer 10 quick questions to get personalized recommendations
          </p>
          <div className="mt-4 bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-6">{currentQuestion.category}</h3>
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelectAnswer(option)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  answers[currentQuestion.id] === option
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-between">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePrevious}
              variant="outline"
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
          </div>

          {!isComplete ? (
            <Button
              onClick={handleNext}
              disabled={!isAnswered}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              Get Recommendations
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
